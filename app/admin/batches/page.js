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
    // We'll only fetch batches when a department is selected
  }, []);

  // Add this effect to fetch batches when department changes
  useEffect(() => {
    if (formData.department) {
      fetchBatchesByDepartment(formData.department);
    } else {
      // Clear batches when no department is selected
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

  // Add a function to fetch all batches (for admins or if needed)
  const fetchAllBatches = async () => {
    try {
      setError('');
      // Create an API endpoint that supports fetching all batches without a department filter
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

      // Validate form data
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
      // Refresh batches for the current department
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
      
      // Refresh the batches list
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Batch Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                name="department"
                value={formData.department}
                onChange={handleChange}
                label="Department"
                disabled={loading}
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
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Creating...' : 'Create Batch'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Typography variant="h6" gutterBottom>
        {formData.department 
          ? `Batches for ${departments.find(d => d._id === formData.department)?.name || 'Selected Department'}`
          : 'Select a department to view batches'}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Department</TableCell>
              <TableCell>Batch Name</TableCell>
              <TableCell>Total Students</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batches.length > 0 ? (
              batches.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell>{batch.department?.name || 'Unknown Department'}</TableCell>
                  <TableCell>{batch.name}</TableCell>
                  <TableCell>{batch.totalStudents}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteClick(batch)}
                      disabled={deleteLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {formData.department ? 'No batches found for this department' : 'Select a department to view batches'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the batch {batchToDelete?.name} ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}