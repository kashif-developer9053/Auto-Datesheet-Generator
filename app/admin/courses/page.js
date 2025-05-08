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
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    semester: '',
    faculty: '',
    credits: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
    fetchFaculty();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch courses');
      }
      
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/departments');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch departments');
      }
      
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError(error.message);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?role=faculty');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch faculty');
      }
      
      setFaculty(data || []);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setError(error.message);
      setFaculty([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate form data
      if (!formData.name || !formData.code || !formData.department || !formData.semester || !formData.faculty) {
        setError('Please fill in all required fields');
        return;
      }

      const url = isEditing ? `/api/courses/${editingId}` : '/api/courses';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || `Failed to ${isEditing ? 'update' : 'create'} course`);
      }

      setSuccess(`Course ${isEditing ? 'updated' : 'created'} successfully`);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} course:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setIsEditing(true);
    setEditingId(course._id);
    setFormData({
      name: course.name,
      code: course.code,
      department: course.department?._id || '',
      semester: course.semester,
      faculty: course.faculty?._id || '',
      credits: course.credits || '',
      description: course.description || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      setSuccess('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      department: '',
      semester: '',
      faculty: '',
      credits: '',
      description: '',
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        Course Management
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

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              title={isEditing ? 'Edit Course' : 'Add New Course'}
              subheader="Fill in the course details below"
              titleTypographyProps={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              subheaderTypographyProps={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            />
            <Divider />
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: { xs: 1, sm: 2 } }}>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Course Name"
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
                      label="Course Code"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      disabled={loading}
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                      />
                  </Grid>
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
                      label="Semester"
                      name="semester"
                      type="number"
                      value={formData.semester}
                      onChange={handleChange}
                      disabled={loading}
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                      />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required size="small" >
                      <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Faculty
                      </InputLabel>
                      <Select
                        name="faculty"
                        value={formData.faculty}
                        onChange={handleChange}
                        label="Faculty"
                        disabled={loading}
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                      >
                        {faculty.map((f) => (
                          <MenuItem key={f._id} value={f._id}>
                            {f.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Credits"
                      name="credits"
                      type="number"
                      value={formData.credits}
                      onChange={handleChange}
                      disabled={loading}
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                      />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      disabled={loading}
                      variant="outlined"
                      size="small"
                      multiline
                      rows={3}
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' ,  minWidth: 250 } }}
                      />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          py: { xs: 1, sm: 1.5 },
                          px: { xs: 2, sm: 3 },
                          width: { xs: '100%', sm: 'auto' },
                        }}
                      >
                        {loading ? 'Processing...' : (isEditing ? 'Update Course' : 'Add Course')}
                      </Button>
                      {isEditing && (
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={resetForm}
                          disabled={loading}
                          sx={{
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            py: { xs: 1, sm: 1.5 },
                            px: { xs: 2, sm: 3 },
                            width: { xs: '100%', sm: 'auto' },
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              title="Course List"
              subheader="All available courses"
              titleTypographyProps={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              subheaderTypographyProps={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            />
            <Divider />
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <TableContainer
                component={Paper}
                sx={{
                  overflowX: 'auto',
                  maxHeight: 400,
                }}
              >
                <Table
                  size="small"
                  sx={{
                    minWidth: { xs: 600, sm: 650 },
                    '& th, & td': {
                      px: { xs: 1, sm: 2 },
                      py: { xs: 0.5, sm: 1 },
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold', width: '20%' }}>
                        Code
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold', width: '30%' }}>
                        Name
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold', width: '30%' }}>
                        Department
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold', width: '10%' }}>
                        Semester
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold', width: '10%' }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course._id} hover>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {course.code}
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {course.name}
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {course.department?.name || '-'}
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {course.semester}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(course)}
                              disabled={loading}
                              sx={{ p: { xs: 0.5, sm: 1 } }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(course._id)}
                              disabled={loading}
                              sx={{ p: { xs: 0.5, sm: 1 } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}