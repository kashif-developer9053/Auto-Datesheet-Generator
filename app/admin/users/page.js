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
} from '@mui/material';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to fetch departments');
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess('User created successfully');
      setFormData({
        name: '',
        email: '',
        password: '',
        role: '',
        department: '',
      });
      fetchUsers();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
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
        sx={{
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        User Management
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
            <TextField
              required
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required sx={{ minWidth: 200 }}>
              <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
                disabled={loading}
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="faculty">Faculty</MenuItem>
                <MenuItem value="student">Student</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required={formData.role === 'faculty' || formData.role === 'student'} sx={{ minWidth: 200 }}>
              <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Department</InputLabel>
              <Select
                name="department"
                value={formData.department}
                onChange={handleChange}
                label="Department"
                disabled={loading}
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          overflowX: 'auto',
          mt: { xs: 2, sm: 3 },
        }}
      >
        <Table sx={{ minWidth: { xs: 600, sm: 650 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                Name
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                Email
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                Role
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                Department
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {user.name}
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {user.email}
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {user.role}
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {user.department?.name || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}