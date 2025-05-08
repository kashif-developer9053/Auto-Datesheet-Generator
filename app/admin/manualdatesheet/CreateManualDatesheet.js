'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';

export default function CreateManualDatesheet({
  open,
  setOpen,
  departments = [],
  batchesByDept = {},
  loadingDepartments,
  loadingBatches,
  fetchBatches,
  setError,
  setSuccess,
  onDatesheetCreated,
}) {
  const [formData, setFormData] = useState({
    name: '',
    academicYear: new Date().getFullYear().toString(),
    examPeriod: 'Mid',
    departmentId: '',
    batchId: '',
    semester: '',
    startDate: null,
    endDate: null,
    schedule: [],
  });
  const [currentExam, setCurrentExam] = useState({
    courseId: '',
    date: null,
    timing: { startTime: '', endTime: '' },
    roomAssignments: [{ roomId: '', facultyId: '', assignedStudents: 0 }],
  });
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(false);

  // Fetch batches when departmentId changes
  useEffect(() => {
    if (formData.departmentId && !batchesByDept[formData.departmentId]?.length) {
      console.log('Fetching batches for department:', formData.departmentId);
      fetchBatches(formData.departmentId);
    } else if (batchesByDept[formData.departmentId]?.length) {
      console.log('Batches already loaded for department:', formData.departmentId);
    }
  }, [formData.departmentId, fetchBatches, batchesByDept]);

  useEffect(() => {
    if (formData.departmentId && formData.semester) {
      const fetchCourses = async () => {
        setFetchingCourses(true);
        try {
          const response = await fetch(
            `/api/courses?departmentId=${formData.departmentId}&semester=${formData.semester}`
          );
          if (!response.ok) throw new Error('Failed to fetch courses');
          const data = await response.json();
          console.log('Fetched courses:', data);
          setCourses(Array.isArray(data) ? data : []);
        } catch (error) {
          setError(`Failed to fetch courses: ${error.message}`);
          setCourses([]);
        } finally {
          setFetchingCourses(false);
        }
      };
      fetchCourses();
    } else {
      setCourses([]);
    }
  }, [formData.departmentId, formData.semester, setError]);

  useEffect(() => {
    if (formData.departmentId) {
      const fetchResources = async () => {
        try {
          const [roomsResponse, facultyResponse] = await Promise.all([
            fetch('/api/rooms'),
            fetch(`/api/users?role=faculty&departmentId=${formData.departmentId}`),
          ]);
          if (!roomsResponse.ok) throw new Error('Failed to fetch rooms');
          if (!facultyResponse.ok) throw new Error('Failed to fetch faculty');
          const roomsData = await roomsResponse.json();
          const facultyData = await facultyResponse.json();
          console.log('Fetched rooms:', roomsData);
          console.log('Fetched faculty:', facultyData);
          setRooms(Array.isArray(roomsData) ? roomsData : []);
          setFaculty(Array.isArray(facultyData) ? facultyData : []);
        } catch (error) {
          setError(`Failed to fetch resources: ${error.message}`);
          setRooms([]);
          setFaculty([]);
        }
      };
      fetchResources();
    } else {
      setRooms([]);
      setFaculty([]);
    }
  }, [formData.departmentId, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!formData.name) throw new Error('Datesheet name is required');
      if (!formData.departmentId) throw new Error('Department is required');
      if (!formData.batchId) throw new Error('Batch is required');
      if (!formData.semester) throw new Error('Semester is required');
      if (!formData.startDate || !formData.endDate) throw new Error('Start and end dates are required');
      if (formData.schedule.length === 0) throw new Error('At least one course schedule is required');
      for (const exam of formData.schedule) {
        if (!exam.courseId) throw new Error('Course selection is required for all exams');
        if (!exam.date) throw new Error('Exam date is required for all exams');
        if (!exam.timing.startTime || !exam.timing.endTime) throw new Error('Time slot is required for all exams');
        if (!exam.roomAssignments[0]?.roomId) throw new Error('Room selection is required for all exams');
        if (!exam.roomAssignments[0]?.facultyId) throw new Error('Faculty selection is required for all exams');
      }

      const conflicts = checkConflicts(formData.schedule);
      if (conflicts.length > 0) {
        throw new Error(`Conflicts detected: ${conflicts.join('; ')}`);
      }

      console.log('Submitting manual datesheet:', JSON.stringify(formData, null, 2));
      const response = await fetch('/api/manual-datesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          academicYear: formData.academicYear,
          examPeriod: formData.examPeriod,
          departmentId: formData.departmentId,
          batchId: formData.batchId,
          semester: formData.semester,
          startDate: formData.startDate?.toISOString(),
          endDate: formData.endDate?.toISOString(),
          schedule: formData.schedule,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create manual datesheet');
      setSuccess('Manual datesheet created successfully!');
      setFormData({
        name: '',
        academicYear: new Date().getFullYear().toString(),
        examPeriod: 'Mid',
        departmentId: '',
        batchId: '',
        semester: '',
        startDate: null,
        endDate: null,
        schedule: [],
      });
      setCurrentExam({
        courseId: '',
        date: null,
        timing: { startTime: '', endTime: '' },
        roomAssignments: [{ roomId: '', facultyId: '', assignedStudents: 0 }],
      });
      setCourses([]);
      setRooms([]);
      setFaculty([]);
      onDatesheetCreated();
      setOpen(false);
    } catch (error) {
      console.error('Error creating manual datesheet:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addExam = () => {
    const course = courses.find((c) => c._id === currentExam.courseId);
    if (!course) {
      setError('Please select a course');
      return;
    }
    if (!currentExam.date) {
      setError('Please select an exam date');
      return;
    }
    if (!currentExam.timing.startTime || !currentExam.timing.endTime) {
      setError('Please select a time slot');
      return;
    }
    if (!currentExam.roomAssignments[0].roomId) {
      setError('Please select a room');
      return;
    }
    if (!currentExam.roomAssignments[0].facultyId) {
      setError('Please select a faculty member');
      return;
    }

    const room = rooms.find((r) => r._id === currentExam.roomAssignments[0].roomId);
    const facultyMember = faculty.find((f) => f._id === currentExam.roomAssignments[0].facultyId);

    setFormData((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          courseId: currentExam.courseId,
          courseCode: course?.code,
          courseName: course?.name,
          totalStudents: course?.totalStudents || 30,
          date: currentExam.date,
          timing: { ...currentExam.timing },
          roomAssignments: [
            {
              roomId: currentExam.roomAssignments[0].roomId,
              roomName: room?.name,
              facultyId: currentExam.roomAssignments[0].facultyId,
              facultyName: facultyMember?.name,
              assignedStudents: course?.totalStudents || 30,
            },
          ],
        },
      ],
    }));
    setCurrentExam({
      courseId: '',
      date: null,
      timing: { startTime: '', endTime: '' },
      roomAssignments: [{ roomId: '', facultyId: '', assignedStudents: 0 }],
    });
    setError('');
  };

  const removeExam = (index) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const checkConflicts = (schedule) => {
    const conflicts = [];
    schedule.forEach((exam, i) => {
      schedule.forEach((otherExam, j) => {
        if (i >= j) return;
        if (
          exam.date?.getTime() === otherExam.date?.getTime() &&
          exam.timing.startTime === otherExam.timing.startTime
        ) {
          if (exam.roomAssignments[0].roomId === otherExam.roomAssignments[0].roomId) {
            conflicts.push(
              `Room conflict for ${exam.courseName || 'exam'} and ${otherExam.courseName || 'exam'} on ${format(
                exam.date,
                'dd/MM/yyyy'
              )} at ${exam.timing.startTime}`
            );
          }
          if (exam.roomAssignments[0].facultyId === otherExam.roomAssignments[0].facultyId) {
            conflicts.push(
              `Faculty conflict for ${exam.courseName || 'exam'} and ${otherExam.courseName || 'exam'} on ${format(
                exam.date,
                'dd/MM/yyyy'
              )} at ${exam.timing.startTime}`
            );
          }
        }
      });
    });
    return conflicts;
  };

  const defaultTimeSlots = formData.examPeriod === 'Mid'
    ? ['09:00 AM - 11:00 AM', '11:30 AM - 01:30 PM']
    : ['09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM'];

  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false);
        setError('');
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle>Create Manual Datesheet</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <form onSubmit={handleSubmit}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                      label="Datesheet Name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                      label="Academic Year"
                    value={formData.academicYear}
                    onChange={(e) => setFormData((prev) => ({ ...prev, academicYear: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required                       sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                  >
                    <InputLabel>Exam Period</InputLabel>
                    <Select
                      value={formData.examPeriod}
                      onChange={(e) => setFormData((prev) => ({ ...prev, examPeriod: e.target.value }))}
                    >
                      <MenuItem value="Mid">Mid Term</MenuItem>
                      <MenuItem value="Final">Final Term</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required                       sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                  >
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          departmentId: e.target.value,
                          batchId: '',
                          semester: '',
                          schedule: [],
                        }))
                      }
                      disabled={loadingDepartments}
                    >
                      {(Array.isArray(departments) ? departments : []).map((dept) => (
                        <MenuItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}                       sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                >
                  <FormControl fullWidth required sx={{ minWidth: 250 }}>
                    <InputLabel>Batch</InputLabel>
                    <Select
                      value={formData.batchId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, batchId: e.target.value }))}
                      disabled={loadingBatches || !formData.departmentId}
                    >
                      {(batchesByDept[formData.departmentId] || []).map((batch) => (
                        <MenuItem key={batch._id} value={batch._id}>
                          {batch.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}                       sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                >
                  <TextField
                    fullWidth
                    label="Semester"
                    value={formData.semester}
                    onChange={(e) => setFormData((prev) => ({ ...prev, semester: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}                       sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                >
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={formData.startDate}
                      onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}                       sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                >
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={formData.endDate}
                      onChange={(date) => setFormData((prev) => ({ ...prev, endDate: date }))}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="h6" gutterBottom>
              Add Exam
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ minWidth: 250 }}>
                    <InputLabel>Course</InputLabel>
                    <Select
                      value={currentExam.courseId}
                      onChange={(e) => {
                        const course = courses.find((c) => c._id === e.target.value);
                        setCurrentExam((prev) => ({
                          ...prev,
                          courseId: e.target.value,
                          roomAssignments: [
                            {
                              ...prev.roomAssignments[0],
                              assignedStudents: course?.totalStudents || 30,
                            },
                          ],
                        }));
                      }}
                      disabled={fetchingCourses || !courses.length}
                    >
                      {(Array.isArray(courses) ? courses : []).map((course) => (
                        <MenuItem key={course._id} value={course._id}>
                          {course.code} - {course.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Exam Date"
                      value={currentExam.date}
                      onChange={(date) => setCurrentExam((prev) => ({ ...prev, date }))}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ minWidth: 250 }}>
                    <InputLabel>Time Slot</InputLabel>
                    <Select
                      value={
                        currentExam.timing.startTime ? `${currentExam.timing.startTime} - ${currentExam.timing.endTime}` : ''
                      }
                      onChange={(e) => {
                        const [startTime, endTime] = e.target.value.split(' - ');
                        setCurrentExam((prev) => ({
                          ...prev,
                          timing: { startTime, endTime },
                        }));
                      }}
                    >
                      {defaultTimeSlots.map((slot) => (
                        <MenuItem key={slot} value={slot}>
                          {slot}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ minWidth: 250 }}>
                    <InputLabel>Room</InputLabel>
                    <Select
                      value={currentExam.roomAssignments[0].roomId || ''}
                      onChange={(e) => {
                        const room = rooms.find((r) => r._id === e.target.value);
                        setCurrentExam((prev) => ({
                          ...prev,
                          roomAssignments: [
                            {
                              ...prev.roomAssignments[0],
                              roomId: e.target.value,
                              roomName: room?.name,
                            },
                          ],
                        }));
                      }}
                    >
                      {(Array.isArray(rooms) ? rooms : []).map((room) => (
                        <MenuItem key={room._id} value={room._id}>
                          {room.name} (Capacity: {room.capacity})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ minWidth: 250 }}>
                    <InputLabel>Faculty</InputLabel>
                    <Select
                      value={currentExam.roomAssignments[0].facultyId || ''}
                      onChange={(e) => {
                        const facultyMember = faculty.find((f) => f._id === e.target.value);
                        setCurrentExam((prev) => ({
                          ...prev,
                          roomAssignments: [
                            {
                              ...prev.roomAssignments[0],
                              facultyId: e.target.value,
                              facultyName: facultyMember?.name,
                            },
                          ],
                        }));
                      }}
                    >
                      {(Array.isArray(faculty) ? faculty : []).map((f) => (
                        <MenuItem key={f._id} value={f._id}>
                          {f.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={addExam}
                    disabled={!formData.departmentId || !formData.semester || !courses.length}
                  >
                    Add Course to Datesheet
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="h6" gutterBottom>
              Scheduled Exams
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
              {formData.schedule.length === 0 ? (
                <Typography>No courses added yet.</Typography>
              ) : (
                <List>
                  {formData.schedule.map((exam, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${exam.courseCode} - ${exam.courseName}`}
                        secondary={`Date: ${exam.date ? format(exam.date, 'dd/MM/yyyy') : 'N/A'}, Time: ${
                          exam.timing.startTime
                        } - ${exam.timing.endTime}, Room: ${exam.roomAssignments[0].roomName}, Faculty: ${
                          exam.roomAssignments[0].facultyName
                        }`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" color="error" onClick={() => removeExam(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading || formData.schedule.length === 0}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Manual Datesheet'}
            </Button>
          </form>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}