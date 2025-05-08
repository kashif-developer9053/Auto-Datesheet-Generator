'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DepartmentConfigCard from './DepartmentConfigCard';

export default function CreateDatesheet({
  open,
  setOpen,
  departments,
  batchesByDept,
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
    startDate: null,
    endDate: null,
    departmentSchedules: [],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (formData.departmentSchedules.length === 0) {
        throw new Error('Please add at least one department');
      }
      formData.departmentSchedules.forEach((schedule, index) => {
        if (!schedule.departmentId) throw new Error(`Please select department for schedule ${index + 1}`);
        if (!schedule.batchId) throw new Error(`Please select batch for schedule ${index + 1}`);
        if (!schedule.semester) throw new Error(`Please enter semester for schedule ${index + 1}`);
        if (schedule.timeSlots.length === 0) throw new Error(`Please add time slots for schedule ${index + 1}`);
      });
      console.log('Submitting formData:', JSON.stringify(formData, null, 2));
      const response = await fetch('/api/datesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate?.toISOString(),
          endDate: formData.endDate?.toISOString(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create datesheet');
      setSuccess('Datesheet created successfully!');
      setFormData({
        name: '',
        academicYear: new Date().getFullYear().toString(),
        examPeriod: 'Mid',
        startDate: null,
        endDate: null,
        departmentSchedules: [],
      });
      onDatesheetCreated();
      setOpen(false);
    } catch (error) {
      console.error('Error creating datesheet:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addDepartmentSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      departmentSchedules: [
        ...prev.departmentSchedules,
        {
          id: Date.now(),
          departmentId: '',
          batchId: '',
          semester: '',
          timeSlots: getDefaultTimeSlots(formData.examPeriod) || ['09:00 AM - 11:00 AM'],
          courses: [],
        },
      ],
    }));
  };

  const removeDepartmentSchedule = (index) => {
    setFormData((prev) => ({
      ...prev,
      departmentSchedules: prev.departmentSchedules.filter((_, i) => i !== index),
    }));
  };

  const updateDepartmentSchedule = (index, updates) => {
    setFormData((prev) => {
      const newSchedules = [...prev.departmentSchedules];
      newSchedules[index] = { ...newSchedules[index], ...updates };
      return { ...prev, departmentSchedules: newSchedules };
    });
  };

  const addTimeSlot = (index) => {
    setFormData((prev) => {
      const newSchedules = [...prev.departmentSchedules];
      newSchedules[index].timeSlots.push('');
      return { ...prev, departmentSchedules: newSchedules };
    });
  };

  const removeTimeSlot = (scheduleIndex, slotIndex) => {
    setFormData((prev) => {
      const newSchedules = [...prev.departmentSchedules];
      newSchedules[scheduleIndex].timeSlots = newSchedules[scheduleIndex].timeSlots.filter(
        (_, i) => i !== slotIndex
      );
      return { ...prev, departmentSchedules: newSchedules };
    });
  };

  const getDefaultTimeSlots = (examPeriod) => {
    return examPeriod === 'Mid'
      ? ['09:00 AM - 11:00 AM', '11:30 AM - 01:30 PM']
      : ['09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM'];
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false);
        setError('');
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>Create New Datesheet</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <form onSubmit={handleSubmit}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                      label="Datesheet Name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                      label="Academic Year"
                    value={formData.academicYear || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, academicYear: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl                       sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
 required>
                    <InputLabel>Exam Period</InputLabel>
                    <Select
                      value={formData.examPeriod || ''}
                      onChange={(e) => {
                        const newPeriod = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          examPeriod: newPeriod,
                          departmentSchedules: prev.departmentSchedules.map((schedule) => ({
                            ...schedule,
                            timeSlots: getDefaultTimeSlots(newPeriod),
                          })),
                        }));
                      }}
                    >
                      <MenuItem value="Mid">Mid Term</MenuItem>
                      <MenuItem value="Final">Final Term</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}                       sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={formData.startDate}
                      onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12}                       sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
 sm={6}>
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

            {formData.departmentSchedules.map((schedule, index) => (
              <DepartmentConfigCard
                key={schedule.id}
                index={index}
                config={schedule}
                departments={departments}
                batchesByDept={batchesByDept}
                loadingDepartments={loadingDepartments}
                loadingBatches={loadingBatches}
                fetchBatches={fetchBatches}
                updateDepartmentSchedule={updateDepartmentSchedule}
                removeDepartmentSchedule={removeDepartmentSchedule}
                addTimeSlot={addTimeSlot}
                removeTimeSlot={removeTimeSlot}
                getDefaultTimeSlots={getDefaultTimeSlots}
              />
            ))}

            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={addDepartmentSchedule}
              sx={{ mb: 3 }}
            >
              Add Department Schedule
            </Button>

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading || formData.departmentSchedules.length === 0}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate Datesheets'}
            </Button>
          </form>
        </Box>
      </DialogContent>
    </Dialog>
  );
}