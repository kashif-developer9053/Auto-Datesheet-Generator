'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function BatchManagement() {
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    department: '',
    name: '',
    totalStudents: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (formData.department) {
      fetchBatchesByDepartment(formData.department);
    } else {
      setBatches([]);
    }
  }, [formData.department]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to fetch departments');
    }
  };

  const fetchBatchesByDepartment = async (departmentId) => {
    try {
      setError('');
      const response = await fetch(`/api/batches?departmentId=${departmentId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch batches');
      }
      const data = await response.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to fetch batches');
      setBatches([]);
    }
  };

  const fetchAllBatches = async () => {
    try {
      setError('');
      const response = await fetch('/api/batches/all');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch batches');
      }
      const data = await response.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching all batches:', error);
      setError('Failed to fetch batches');
      setBatches([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!formData.department || !formData.name || !formData.totalStudents) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          department: formData.department,
          totalStudents: parseInt(formData.totalStudents),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create batch');
      }

      setSuccess('Batch created successfully');
      setFormData({
        ...formData,
        name: '',
        totalStudents: '',
      });
      fetchBatchesByDepartment(formData.department);
    } catch (error) {
      console.error('Error creating batch:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeleteClick = (batch) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!batchToDelete) return;
    
    try {
      setDeleteLoading(true);
      setError('');
      
      const response = await fetch(`/api/batches?id=${batchToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete batch');
      }

      setSuccess('Batch deleted successfully');
      
      if (formData.department) {
        fetchBatchesByDepartment(formData.department);
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      setError(error.message);
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setBatchToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBatchToDelete(null);
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4 },
        maxWidth: { sm: 'sm', md: 'md', lg: 'lg' },
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        color='black'
        sx={{
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        Batch Management
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            fontSize: { xs: '0.875rem', sm: '1rem' },
            px: { xs: 2, sm: 3 },
          }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 2,
            fontSize: { xs: '0.875rem', sm: '1rem' },
            px: { xs: 2, sm: 3 },
          }}
        >
          {success}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          mt: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 3, sm: 4 },
        }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required size="small">
              <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Department
              </InputLabel>
              <Select
                name="department"
                value={formData.department}
                onChange={handleChange}
                label="Department"
                disabled={loading}
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Batch Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              variant="outlined"
              size="small"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
              />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Total Students"
              name="totalStudents"
              type="number"
              value={formData.totalStudents}
              onChange={handleChange}
              disabled={loading}
              variant="outlined"
              size="small"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
              />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 2, sm: 3 },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {loading ? 'Creating...' : 'Create Batch'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontSize: { xs: '1rem', sm: '1.25rem' },
          mt: { xs: 2, sm: 3 },
        }}
      >
        {formData.department
          ? `Batches for ${departments.find((d) => d._id === formData.department)?.name || 'Selected Department'}`
          : 'Select a department to view batches'}
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          mt: { xs: 2, sm: 3 },
        }}
      >
        <Table
          size="small"
          sx={{
            width: '100%',
            tableLayout: 'auto',
            '& th, & td': {
              px: { xs: 0.5, sm: 1 },
              py: { xs: 0.5, sm: 1 },
              whiteSpace: 'normal',
              wordWrap: 'break-word',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, fontWeight: 'bold', width: '35%' }}>
                Department
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, fontWeight: 'bold', width: '35%' }}>
                Batch Name
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, fontWeight: 'bold', width: '15%' }}>
                Students
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, fontWeight: 'bold', width: '15%' }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batches.length > 0 ? (
              batches.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    {batch.department?.name || 'Unknown Department'}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    {batch.name}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    {batch.totalStudents}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(batch)}
                      disabled={deleteLoading}
                      sx={{ p: { xs: 0.5, sm: 1 } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 2 }}>
                  {formData.department ? 'No batches found for this department' : 'Select a department to view batches'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        fullWidth
        maxWidth="sm"
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: '90%', sm: '500px' },
            p: { xs: 2, sm: 3 },
          },
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Are you sure you want to delete the batch {batchToDelete?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            disabled={deleteLoading}
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: '1.5rem' },
              px: { xs: 2, sm: 3 },
            }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}