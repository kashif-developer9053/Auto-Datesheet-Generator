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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import * as XLSX from 'xlsx-js-style';
import { format } from 'date-fns';

export default function ViewDatesheets({ session, setError, setSuccess, fetchBatches }) {
  const [datesheets, setDatesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewDatesheet, setViewDatesheet] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    fetchDatesheets();
  }, [session]);

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
      const response = await fetch('/api/datesheets');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch datesheets');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid datesheet data received');
      }
      console.log('Raw datesheets fetched:', JSON.stringify(data, null, 2));

      let filteredData = data;
      if (session.user.role === 'student' && session.user.department) {
        filteredData = data.filter(ds => String(ds.departmentId) === String(session.user.department));
      }

      const enrichedDatesheets = await Promise.all(
        filteredData.map(async (datesheet) => {
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

  const handleView = async (datesheet) => {
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
    } catch (error) {
      console.error('Error fetching datesheet:', error);
      setError(`Failed to load datesheet details: ${error.message}`);
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
      ['Date (Day)', 'Time',  'Course', 'Instructor(s)', 'Batch', 'Room(s)'],
    ];

    const dataRows = [];
    groupedSchedule.forEach((group, groupIndex) => {
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

    // Apply styles
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
            fill: {
              fgColor: {
                rgb: R % 2 === 0 ? 'F3F6FA' : 'FFFFFF',
              },
            },
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
        throw new Error(errData.error || 'PDF export failed');
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
      const response = await fetch(`/api/datesheets?id=${datesheet.originalId}`, {
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

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Exam Period</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : datesheets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No datesheets found
                </TableCell>
              </TableRow>
            ) : (
              datesheets.map((datesheet) => (
                <TableRow key={datesheet._id}>
                  <TableCell>{datesheet.name || 'N/A'}</TableCell>
                  <TableCell>{datesheet.department?.name || 'N/A'}</TableCell>
                  <TableCell>{datesheet.examPeriod || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleView(datesheet)}
                      color="primary"
                      title="View Datesheet"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => exportToExcel(datesheet)}
                      color="primary"
                      title="Export to Excel"
                    >
                      <FileDownloadIcon />
                    </IconButton>
                   
                    {(session.user.role === 'admin' || session.user.role === 'faculty') && (
                      <IconButton
                        onClick={() => handleDelete(datesheet)}
                        color="error"
                        title="Delete Datesheet"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h5">INTERNATIONAL ISLAMIC UNIVERSITY</Typography>
            <Typography variant="h6">{viewDatesheet?.department?.name?.toUpperCase() || 'DEPARTMENT'}</Typography>
            <Typography variant="subtitle1">
              {viewDatesheet?.examPeriod?.toUpperCase() || 'N/A'} DATESHEET {viewDatesheet?.academicYear || 'N/A'}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Duration:{' '}
              {viewDatesheet?.startDate
                ? format(new Date(viewDatesheet.startDate), 'dd/MM/yyyy')
                : 'N/A'}{' '}
              -{' '}
              {viewDatesheet?.endDate
                ? format(new Date(viewDatesheet.endDate), 'dd/MM/yyyy')
                : 'N/A'}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Version Release Date: {format(new Date(), 'dd MMMM yyyy')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : viewDatesheet?.groupedSchedule && viewDatesheet.groupedSchedule.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#d3d3d3' }}>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Date (Day)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Semester</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Instructor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Batch</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Room(s)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewDatesheet.groupedSchedule.map((group, groupIndex) =>
                    group.exams.map((exam, examIndex) => (
                      <TableRow
                        key={`${groupIndex}-${examIndex}`}
                        sx={{
                          backgroundColor: groupIndex % 2 === 0 ? '#f0f0f0' : '#ffe4e1',
                          borderTop: examIndex === 0 ? '2px solid black' : 'none',
                        }}
                      >
                        {examIndex === 0 ? (
                          <TableCell rowSpan={group.exams.length} sx={{ borderRight: '1px solid #ccc' }}>
                            {group.date}
                          </TableCell>
                        ) : null}
                        {examIndex === 0 ? (
                          <TableCell rowSpan={group.exams.length} sx={{ borderRight: '1px solid #ccc' }}>
                            {group.time}
                          </TableCell>
                        ) : null}
                        {examIndex === 0 ? (
                          <TableCell rowSpan={group.exams.length} sx={{ borderRight: '1px solid #ccc' }}>
                            {group.semester}
                          </TableCell>
                        ) : null}
                        <TableCell>{`${exam.courseCode || ''} ${exam.courseName || 'Unknown'}`}</TableCell>
                        <TableCell>
                          {exam.roomAssignments?.length
                            ? exam.roomAssignments.map((r) => r.facultyName || 'Unknown').join(', ')
                            : 'TBD'}
                        </TableCell>
                        <TableCell>{group.batchName || 'Unknown'}</TableCell>
                        <TableCell>
                          {exam.roomAssignments?.length
                            ? exam.roomAssignments.map((r) => r.roomName || 'Unknown').join(', ')
                            : 'TBD'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="body1" color="text.secondary">
                No schedule data available for this datesheet.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
          {viewDatesheet?.schedules && viewDatesheet.schedules.some(s => s.schedule && s.schedule.length > 0) && (
            <>
              <Button
                onClick={() => exportToExcel(viewDatesheet)}
                startIcon={<FileDownloadIcon />}
                variant="contained"
                disabled={loading}
              >
                Export to Excel
              </Button>
             
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}