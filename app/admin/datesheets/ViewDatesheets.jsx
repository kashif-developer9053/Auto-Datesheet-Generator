'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import * as XLSX from 'xlsx-js-style';
import { format } from 'date-fns';

export default function ViewDatesheets({ session, setError, setSuccess, fetchBatches }) {
  const [datesheets, setDatesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewDatesheet, setViewDatesheet] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', description: '' });
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    console.log('Session object:', JSON.stringify(session, null, 2));
    if (!session?.user?.id) {
      setError('User session is not authenticated. Please log in.');
      return;
    }
    fetchDatesheets();
  }, [session, setError]);

  const fetchDepartmentName = async (departmentId) => {
    if (!departmentId) return 'Unknown';
    try {
      const response = await fetch(`/api/departments/${departmentId}`);
      if (!response.ok) {
        console.warn(`Department ${departmentId} not found`);
        return 'Unknown';
      }
      const data = await response.json();
      console.log(`Department ${departmentId} fetched:`, JSON.stringify(data, null, 2));
      return data.name || 'Unknown';
    } catch (error) {
      console.error(`Error fetching department ${departmentId}:`, error);
      return 'Unknown';
    }
  };

  const fetchBatchName = async (batchId) => {
    if (!batchId) return 'Unknown';
    try {
      const response = await fetch(`/api/batches/${batchId}`);
      if (!response.ok) {
        console.warn(`Batch ${batchId} not found`);
        return 'Unknown';
      }
      const data = await response.json();
      console.log(`Batch ${batchId} fetched:`, JSON.stringify(data, null, 2));
      return data.name || 'Unknown';
    } catch (error) {
      console.error(`Error fetching batch ${batchId}:`, error);
      return 'Unknown';
    }
  };

  const fetchDatesheets = async () => {
    setLoading(true);
    setError('');
    try {
      const [autoResponse, manualResponse] = await Promise.all([
        fetch('/api/datesheets'),
        fetch('/api/manual-datesheets'),
      ]);

      if (!autoResponse.ok) {
        const errorData = await autoResponse.json();
        throw new Error(errorData.error || 'Failed to fetch auto datesheets');
      }
      if (!manualResponse.ok) {
        const errorData = await manualResponse.json();
        throw new Error(errorData.error || 'Failed to fetch manual datesheets');
      }

      const autoData = await autoResponse.json();
      const manualData = await manualResponse.json();

      if (!Array.isArray(autoData) || !Array.isArray(manualData)) {
        throw new Error('Invalid datesheet data received');
      }

      console.log('Raw auto datesheets:', JSON.stringify(autoData, null, 2));
      console.log('Raw manual datesheets:', JSON.stringify(manualData, null, 2));

      let combinedData = [...autoData, ...manualData];

      if (session?.user?.role === 'student' && session?.user?.department) {
        combinedData = combinedData.filter(ds => String(ds.departmentId) === String(session.user.department));
      }

      const enrichedDatesheets = await Promise.all(
        combinedData.map(async (datesheet) => {
          const departmentName = await fetchDepartmentName(datesheet.departmentId);
          const schedulesWithBatchNames = await Promise.all(
            (datesheet.schedules || []).map(async (schedule) => {
              const batchName = await fetchBatchName(schedule.batchId);
              return { ...schedule, batchName };
            })
          );
          return {
            _id: datesheet._id,
            originalId: datesheet._id,
            name: datesheet.name,
            department: { name: departmentName },
            examPeriod: datesheet.examPeriod,
            academicYear: datesheet.academicYear,
            startDate: datesheet.startDate,
            endDate: datesheet.endDate,
            schedules: schedulesWithBatchNames.map((schedule) => ({
              batchId: schedule.batchId,
              batchName: schedule.batchName,
              semester: schedule.semester,
              examTimings: schedule.examTimings || [],
              schedule: schedule.schedule || [],
            })),
            isManual: manualData.some(md => md._id.toString() === datesheet._id.toString()),
          };
        })
      );

      setDatesheets(enrichedDatesheets);
      console.log('Enriched datesheets loaded:', JSON.stringify(enrichedDatesheets, null, 2));
    } catch (error) {
      console.error('Error fetching datesheets:', error);
      setError(`Failed to load datesheets: ${error.message}`);
      setDatesheets([]);
    } finally {
      setLoading(false);
    }
  };

  const generateGroupedSchedule = (schedules) => {
    if (!schedules || schedules.length === 0) return [];
    const allExams = schedules.flatMap((schedule) =>
      (schedule.schedule || []).map((exam) => ({
        ...exam,
        batchName: schedule.batchName,
        semester: schedule.semester,
      }))
    );
    return Object.values(
      allExams.reduce((acc, exam) => {
        const date = exam.date ? format(new Date(exam.date), 'dd/MM/yyyy (EEEE)') : 'N/A';
        const time = exam.timing?.startTime && exam.timing?.endTime
          ? `${exam.timing.startTime} - ${exam.timing.endTime}`
          : 'N/A';
        const key = `${date}|${time}|${exam.semester}|${exam.batchName}`;
        if (!acc[key]) {
          acc[key] = { date, time, semester: exam.semester, batchName: exam.batchName, exams: [] };
        }
        acc[key].exams.push(exam);
        return acc;
      }, {})
    );
  };

  const handleView = async (datesheet, showForm = false) => {
    try {
      setLoading(true);
      setError('');
      console.log('Opening datesheet:', JSON.stringify(datesheet, null, 2));
      const enrichedDatesheet = {
        ...datesheet,
        groupedSchedule: generateGroupedSchedule(datesheet.schedules),
      };
      if (!enrichedDatesheet.schedules || enrichedDatesheet.schedules.every(s => !s.schedule || s.schedule.length === 0)) {
        setError('No schedule data available for this datesheet.');
      }
      setViewDatesheet(enrichedDatesheet);
      setViewOpen(true);
      setShowReportForm(showForm);
      if (showForm) {
        setReportForm({ title: '', description: '' });
        setReportError('');
      }
    } catch (error) {
      console.error('Error fetching datesheet:', error);
      setError(`Failed to load datesheet details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReportConflict = () => {
    setShowReportForm(true);
    setReportForm({ title: '', description: '' });
    setReportError('');
  };

  const handleReportSubmit = async () => {
    if (!reportForm.title.trim() || !reportForm.description.trim()) {
      setReportError('Title and description are required.');
      return;
    }

    if (!viewDatesheet?.originalId || !session?.user?.name) {
      setReportError('Cannot submit report: Invalid datesheet or user session. Please log in and try again.');
      console.error('Missing critical data:', {
        datesheetId: viewDatesheet?.originalId,
        userName: session?.user?.name,
        session: JSON.stringify(session, null, 2),
      });
      return;
    }

    if (typeof session.user.name !== 'string' || session.user.name.trim() === '') {
      setReportError('Invalid user name in session. Please contact support.');
      console.error('Invalid session.user.name:', session.user.name);
      return;
    }

    const requestBody = {
      datesheetId: viewDatesheet.originalId,
      title: reportForm.title,
      description: reportForm.description,
      reportedBy: session.user.name,
      isManual: viewDatesheet.isManual,
    };
    console.log('Submitting conflict report with body:', JSON.stringify(requestBody, null, 2));

    try {
      setLoading(true);
      setReportError('');
      const response = await fetch('/api/conflict-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit conflict report');
      }

      setSuccess('Conflict report submitted successfully');
      setShowReportForm(false);
      setReportForm({ title: '', description: '' });
    } catch (error) {
      console.error('Error submitting conflict report:', error);
      setReportError(`Failed to submit conflict report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (datesheet) => {
    const groupedSchedule = datesheet.groupedSchedule || generateGroupedSchedule(datesheet.schedules);
    if (!groupedSchedule || groupedSchedule.length === 0) return;

    const wb = XLSX.utils.book_new();
    const header = [
      ['INTERNATIONAL ISLAMIC UNIVERSITY'],
      [`DEPARTMENT OF ${datesheet.department?.name?.toUpperCase() || 'UNKNOWN'}`],
      [`${datesheet.examPeriod?.toUpperCase()} DATESHEET - ${datesheet.academicYear}`],
      [
        `Duration: ${format(new Date(datesheet.startDate), 'dd/MM/yyyy')} - ${format(
          new Date(datesheet.endDate),
          'dd/MM/yyyy'
        )}`,
      ],
      [`Version Release: ${format(new Date(), 'dd MMMM yyyy')}`],
      [''],
      ['Date (Day)', 'Time', 'Course', 'Instructor(s)', 'Batch', 'Room(s)'],
    ];

    const dataRows = [];
    groupedSchedule.forEach((group) => {
      group.exams.forEach((exam, examIndex) => {
        dataRows.push([
          examIndex === 0 ? group.date : '',
          examIndex === 0 ? group.time : '',
          `${exam.courseCode || ''} ${exam.courseName || 'Unknown'}`,
          exam.roomAssignments?.map(r => r.facultyName || 'Unknown').join(', ') || 'TBD',
          group.batchName || 'Unknown',
          exam.roomAssignments?.map(r => r.roomName || 'Unknown').join(', ') || 'TBD',
        ]);
      });
    });

    const allRows = [...header, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 0; R <= range.e.r; ++R) {
      for (let C = 0; C <= range.e.c; ++C) {
        const cellAddress = { r: R, c: C };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!ws[cellRef]) continue;
        if (R === 0) {
          ws[cellRef].s = {
            font: { bold: true, sz: 16, color: { rgb: '1F4E78' } },
            alignment: { horizontal: 'center' },
          };
        } else if (R >= 1 && R <= 4) {
          ws[cellRef].s = {
            font: { bold: true, sz: 12 },
            alignment: { horizontal: 'center' },
          };
        } else if (R === 6) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '2F5496' } },
            alignment: { horizontal: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
            },
          };
        } else if (R > 6) {
          ws[cellRef].s = {
            font: { name: 'Calibri', sz: 11 },
            alignment: { wrapText: true },
            fill: { fgColor: { rgb: R % 2 === 0 ? 'F3F6FA' : 'FFFFFF' } },
            border: {
              top: { style: 'thin', color: { rgb: 'AAAAAA' } },
              bottom: { style: 'thin', color: { rgb: 'AAAAAA' } },
              left: { style: 'thin', color: { rgb: 'AAAAAA' } },
              right: { style: 'thin', color: { rgb: 'AAAAAA' } },
            },
          };
        }
      }
    }

    ws['!cols'] = [
      { wch: 20 },
      { wch: 18 },
      { wch: 35 },
      { wch: 35 },
      { wch: 30 },
      { wch: 15 },
      { wch: 18 },
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Datesheet');
    XLSX.writeFile(wb, `Datesheet_${datesheet.name || 'Export'}.xlsx`);
  };

  const exportToPDF = async (datesheet) => {
    try {
      setLoading(true);
      const pdfData = {
        name: datesheet.name || 'Datesheet',
        departmentName: datesheet.department?.name?.toUpperCase() || 'DEPARTMENT',
        examPeriod: datesheet.examPeriod?.toUpperCase() || 'N/A',
        academicYear: datesheet.academicYear || 'N/A',
        startDate: datesheet.startDate ? format(new Date(datesheet.startDate), 'dd/MM/yyyy') : 'N/A',
        endDate: datesheet.endDate ? format(new Date(datesheet.endDate), 'dd/MM/yyyy') : 'N/A',
        versionReleaseDate: format(new Date(), 'dd MMMM yyyy'),
        groupedSchedule: generateGroupedSchedule(datesheet.schedules),
      };

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to export PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datesheet_${datesheet.name || 'export'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('PDF exported successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      setError('Failed to export PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (datesheet) => {
    if (!window.confirm('Are you sure? Deleting this will remove the entire department datesheet.')) return;
    try {
      setLoading(true);
      setError('');
      const endpoint = datesheet.isManual ? '/api/manual-datesheets' : '/api/datesheets';
      const response = await fetch(`${endpoint}?id=${datesheet.originalId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete datesheet');
      }
      setSuccess('Datesheet deleted successfully');
      await fetchDatesheets();
    } catch (error) {
      console.error('Error deleting datesheet:', error);
      setError(`Failed to delete datesheet: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user?.id) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Typography
          variant="h6"
          color="error"
          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
        >
          Please log in to view datesheets or report conflicts.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ overflowX: { xs: 'auto', sm: 'visible' } }}>
        <Table
          sx={{
            minWidth: { xs: 650, sm: 'auto' },
            '& th, & td': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
              px: { xs: 1, sm: 2 },
              py: { xs: 0.5, sm: 1 },
              whiteSpace: { xs: 'normal', sm: 'nowrap' },
              wordWrap: { xs: 'break-word', sm: 'normal' },
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Exam Period</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : datesheets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No datesheets found
                </TableCell>
              </TableRow>
            ) : (
              datesheets.map((datesheet) => (
                <TableRow key={datesheet._id}>
                  <TableCell>{datesheet.name || 'N/A'}</TableCell>
                  <TableCell>{datesheet.department?.name || 'N/A'}</TableCell>
                  <TableCell>{datesheet.examPeriod || 'N/A'}</TableCell>
                  <TableCell>{datesheet.isManual ? 'Manual' : 'Auto'}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleView(datesheet)}
                      color="primary"
                      title="View Datesheet"
                      sx={{ p: { xs: 1.5, sm: 1 } }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => exportToExcel(datesheet)}
                      color="primary"
                      title="Export to Excel"
                      sx={{ p: { xs: 1.5, sm: 1 } }}
                    >
                      <FileDownloadIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleView(datesheet, true)}
                      color="warning"
                      title="Report Conflict"
                      sx={{ p: { xs: 1.5, sm: 1 } }}
                    >
                      <ReportProblemIcon fontSize="small" />
                    </IconButton>
                    {(session.user.role === 'admin' || session.user.role === 'faculty') && (
                      <IconButton
                        onClick={() => handleDelete(datesheet)}
                        color="error"
                        title="Delete Datesheet"
                        sx={{ p: { xs: 1.5, sm: 1 } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: '95%', sm: 'auto' },
            maxHeight: { xs: '90vh', sm: 'auto' },
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography
              variant="h5"
              sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
            >
              INTERNATIONAL ISLAMIC UNIVERSITY
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              {viewDatesheet?.department?.name?.toUpperCase() || 'DEPARTMENT'}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {viewDatesheet?.examPeriod?.toUpperCase() || 'N/A'} DATESHEET{' '}
              {viewDatesheet?.academicYear || 'N/A'}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Duration:{' '}
              {viewDatesheet?.startDate
                ? format(new Date(viewDatesheet.startDate), 'dd/MM/yyyy')
                : 'N/A'}{' '}
              -{' '}
              {viewDatesheet?.endDate
                ? format(new Date(viewDatesheet.endDate), 'dd/MM/yyyy')
                : 'N/A'}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Version Release Date: {format(new Date(), 'dd MMMM yyyy')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : showReportForm ? (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
              >
                Report a Conflict
              </Typography>
              {reportError && (
                <Alert
                  severity="error"
                  sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {reportError}
                </Alert>
              )}
              <TextField
                label="Title"
                fullWidth
                value={reportForm.title}
                onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                margin="normal"
                required
                inputProps={{ maxLength: 100 }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  },
                }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                margin="normal"
                required
                inputProps={{ maxLength: 1000 }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  },
                }}
              />
              <Box
                sx={{
                  mt: 2,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'flex-end',
                  gap: 1,
                }}
              >
                <Button
                  onClick={() => setShowReportForm(false)}
                  disabled={loading}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    py: { xs: 1, sm: 0.5 },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReportSubmit}
                  variant="contained"
                  disabled={loading}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    py: { xs: 1, sm: 0.5 },
                  }}
                >
                  Submit
                </Button>
              </Box>
            </Box>
          ) : viewDatesheet?.groupedSchedule && viewDatesheet.groupedSchedule.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{
                overflowX: { xs: 'auto', sm: 'visible' },
                maxHeight: { xs: '60vh', sm: 'none' },
              }}
            >
              <Table
                sx={{
                  minWidth: { xs: 650, sm: 'auto' },
                  '& th, & td': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    px: { xs: 1, sm: 2 },
                    py: { xs: 0.5, sm: 1 },
                    whiteSpace: { xs: 'normal', sm: 'nowrap' },
                    wordWrap: { xs: 'break-word', sm: 'normal' },
                  },
                }}
              >
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#d3d3d3' }}>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>
                      Date (Day)
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>
                      Time
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Semester</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Instructor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Batch</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Room(s)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewDatesheet?.groupedSchedule.map((group, groupIndex) =>
                    group.exams.map((exam, examIndex) => (
                      <TableRow
                        key={`${groupIndex}-${examIndex}`}
                        sx={{
                          backgroundColor: groupIndex % 2 === 0 ? 'rgb(240, 240, 240)' : 'rgb(255, 228, 225)',
                          borderTop: examIndex === 0 ? '2px solid black' : 'none',
                        }}
                      >
                        {examIndex === 0 ? (
                          <TableCell
                            rowSpan={group.exams.length}
                            sx={{ borderRight: '1px solid rgb(204, 204, 204)' }}
                          >
                            {group.date}
                          </TableCell>
                        ) : null}
                        {examIndex === 0 ? (
                          <TableCell
                            rowSpan={group.exams.length}
                            sx={{ borderRight: '1px solid rgb(204, 204, 204)' }}
                          >
                            {group.time}
                          </TableCell>
                        ) : null}
                        {examIndex === 0 ? (
                          <TableCell
                            rowSpan={group.exams.length}
                            sx={{ borderRight: '1px solid rgb(204, 204, 204)' }}
                          >
                            {group.semester}
                          </TableCell>
                        ) : null}
                        <TableCell>
                          {`${exam.courseCode || ''} ${exam.courseName || 'Unknown'}`}
                        </TableCell>
                        <TableCell>
                          {exam.roomAssignments?.length
                            ? exam.roomAssignments
                                .map((r) => r.facultyName || 'Unknown')
                                .join(', ')
                            : 'TBD'}
                        </TableCell>
                        <TableCell>{group.batchName || 'Unknown'}</TableCell>
                        <TableCell>
                          {exam.roomAssignments?.length
                            ? exam.roomAssignments
                                .map((r) => r.roomName || 'Unknown')
                                .join(', ')
                            : 'TBD'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                No schedule data available for this datesheet.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Button
            onClick={() => setViewOpen(false)}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 0.5 },
            }}
          >
            Close
          </Button>
          {viewDatesheet?.schedules &&
            viewDatesheet.schedules.some((s) => s.schedule && s.schedule.length > 0) && (
              <>
                <Button
                  onClick={() => exportToExcel(viewDatesheet)}
                  startIcon={<FileDownloadIcon />}
                  variant="contained"
                  disabled={loading}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    py: { xs: 1, sm: 0.5 },
                  }}
                >
                  Export to Excel
                </Button>
                <Button
                  onClick={() => exportToPDF(viewDatesheet)}
                  startIcon={<PictureAsPdfIcon />}
                  variant="contained"
                  disabled={loading}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    py: { xs: 1, sm: 0.5 },
                  }}
                >
                  Export to PDF
                </Button>
                <Button
                  onClick={handleReportConflict}
                  startIcon={<ReportProblemIcon />}
                  variant="outlined"
                  color="warning"
                  disabled={loading}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    py: { xs: 1, sm: 0.5 },
                  }}
                >
                  Report Conflict
                </Button>
              </>
            )}
        </DialogActions>
      </Dialog>
    </>
  );
}