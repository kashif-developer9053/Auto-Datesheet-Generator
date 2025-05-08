'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Alert,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    building: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      setError('Failed to fetch rooms');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess('Room added successfully');
      setFormData({ name: '', capacity: '', building: '' });
      fetchRooms();
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
        backgroundColor: 'background.default',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        color="black"
        sx={{
          fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
          fontWeight: 700,
          textAlign: { xs: 'center', sm: 'left' },
          mb: { xs: 3, sm: 4 },
        }}
      >
        Room Management
      </Typography>

      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mb: { xs: 3, sm: 4 },
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Room Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  },
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  },
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Building"
                name="building"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                required
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  },
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={<AddIcon />}
                sx={{
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 3, sm: 4 },
                  width: { xs: '100%', sm: 'auto' },
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    boxShadow: 6,
                  },
                }}
              >
                Add Room
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            fontSize: { xs: '1rem', sm: '1.125rem' },
            px: { xs: 3, sm: 4 },
            py: 1,
            borderRadius: 1,
            boxShadow: 1,
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
            fontSize: { xs: '1rem', sm: '1.125rem' },
            px: { xs: 3, sm: 4 },
            py: 1,
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          {success}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{
          mt: { xs: 2, sm: 3 },
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <Table
          size="small"
          sx={{
            width: '100%',
            tableLayout: 'auto',
            '& th, & td': {
              px: { xs: 1, sm: 2 },
              py: { xs: 1, sm: 1.5 },
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 'bold',
                  width: '30%',
                  backgroundColor: 'grey.100',
                }}
              >
                Room Name
              </TableCell>
              <TableCell
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 'bold',
                  width: '15%',
                  backgroundColor: 'grey.100',
                }}
              >
                Capacity
              </TableCell>
              <TableCell
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 'bold',
                  width: '30%',
                  backgroundColor: 'grey.100',
                }}
              >
                Building
              </TableCell>
              <TableCell
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 'bold',
                  width: '15%',
                  backgroundColor: 'grey.100',
                }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 'bold',
                  width: '10%',
                  textAlign: 'center',
                  backgroundColor: 'grey.100',
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.length > 0 ? (
              rooms.map((room, index) => (
                <TableRow
                  key={room._id}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    backgroundColor: index % 2 === 0 ? 'background.paper' : 'grey.50',
                  }}
                >
                  <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {room.name}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {room.capacity}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {room.building}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {room.isAvailable ? 'Available' : 'Not Available'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      disabled={loading}
                      sx={{
                        p: { xs: 1, sm: 1.5 },
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' },
                      }}
                    >
                      <EditIcon fontSize="small" color="primary" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={loading}
                      sx={{
                        p: { xs: 1, sm: 1.5 },
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' },
                      }}
                    >
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, py: 3 }}
                >
                  No rooms found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}