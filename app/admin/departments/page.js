'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingDepartment 
        ? `/api/departments?id=${editingDepartment._id}`
        : '/api/departments';
      
      const response = await fetch(url, {
        method: editingDepartment ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save department');
      }

      setSuccess(editingDepartment ? 'Department updated successfully' : 'Department created successfully');
      setFormData({ name: '', code: '' });
      setEditingDepartment(null);
      fetchDepartments();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      const response = await fetch(`/api/departments?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete department');

      setSuccess('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDepartment(null);
    setFormData({ name: '', code: '' });
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 }, maxWidth: { sm: 'sm', md: 'md', lg: 'lg' }, mx: 'auto' }}>
      <Typography
        variant="h4"
        gutterBottom color='black'
        sx={{
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        Department Management
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

      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          {editingDepartment ? 'Edit Department' : 'Add New Department'}
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 2 },
          }}
        >
          <TextField
            label="Department Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            fullWidth
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          />
          <TextField
            label="Department Code"
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            required
            fullWidth
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              minWidth: { xs: '100%', sm: '120px' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 2, sm: 3 },
            }}
          >
            {editingDepartment ? 'Update' : 'Add'}
          </Button>
        </Box>
      </Paper>

      <TableContainer
        component={Paper}
        sx={{
          overflowX: 'auto',
          mt: { xs: 2, sm: 3 },
        }}
      >
        <Table sx={{ minWidth: { xs: 500, sm: 600 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                Department Name
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                Department Code
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department._id}>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {department.name}
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {department.code}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEdit(department)}
                    color="primary"
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(department._id)}
                    color="error"
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
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
          Edit Department
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: { xs: 1, sm: 2 } }}>
            <TextField
              label="Department Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              fullWidth
              sx={{
                mb: { xs: 2, sm: 2 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            />
            <TextField
              label="Department Code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              required
              fullWidth
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 2, sm: 3 },
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}