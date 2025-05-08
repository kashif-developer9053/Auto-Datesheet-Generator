'use client';

import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  TextField,
  IconButton,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export default function DepartmentConfigCard({
  index,
  config,
  departments,
  batchesByDept,
  loadingDepartments,
  loadingBatches,
  fetchBatches,
  updateDepartmentSchedule,
  removeDepartmentSchedule,
  addTimeSlot,
  removeTimeSlot,
  getDefaultTimeSlots,
}) {
  return (
    <Card sx={{ mb: 2 }} >
      <CardHeader
        action={
          <IconButton onClick={() => removeDepartmentSchedule(index)} color="error">
            <DeleteIcon />
          </IconButton>
        }
        title={`Department Configuration ${index + 1}`  }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required sx={{ minWidth: 250 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={config.departmentId || ''}
                onChange={(e) => {
                  const deptId = e.target.value;
                  updateDepartmentSchedule(index, {
                    departmentId: deptId,
                    batchId: '',
                    timeSlots: getDefaultTimeSlots(config.examPeriod),
                  });
                  fetchBatches(deptId);
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 300,
                    },
                  },
                }}
              >
                {loadingDepartments ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : departments.length === 0 ? (
                  <MenuItem disabled>No departments available</MenuItem>
                ) : (
                  departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required sx={{ minWidth: 250 }}>
              <InputLabel>Batch</InputLabel>
              <Select
                value={config.batchId || ''}
                onChange={(e) => updateDepartmentSchedule(index, { batchId: e.target.value })}
                disabled={!config.departmentId || loadingBatches[config.departmentId]}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 300,
                    },
                  },
                }}
              >
                {loadingBatches[config.departmentId] ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : !batchesByDept[config.departmentId]?.length ? (
                  <MenuItem disabled>No batches available</MenuItem>
                ) : (
                  batchesByDept[config.departmentId].map((batch) => (
                    <MenuItem key={batch._id} value={batch._id}>
                      {batch.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required sx={{ minWidth: 250 }}>
              <InputLabel>Semester</InputLabel>
              <Select
                value={config.semester || ''}
                onChange={(e) => updateDepartmentSchedule(index, { semester: e.target.value })}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 300,
                    },
                  },
                }}
              >
                {['1', '2', '3', '4', '5', '6', '7', '8'].map((semester) => (
                  <MenuItem key={semester} value={semester}>
                    {semester}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Time Slots
            </Typography>
            {config.timeSlots.map((slot, slotIndex) => (
              <Box key={slotIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  value={slot}
                  onChange={(e) =>
                    updateDepartmentSchedule(index, {
                      timeSlots: config.timeSlots.map((s, i) =>
                        i === slotIndex ? e.target.value : s
                      ),
                    })
                  }
                  placeholder="e.g., 09:00 AM - 12:00 PM"
                  sx={{ mr: 1 }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeTimeSlot(index, slotIndex)}
                  disabled={config.timeSlots.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => addTimeSlot(index)}
              sx={{ mt: 1 }}
            >
              Add Time Slot
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}