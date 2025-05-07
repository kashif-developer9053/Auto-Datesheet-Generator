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
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';

export default function ViewConflictReports({ session }) {
  const [conflictReports, setConflictReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Session object:', JSON.stringify(session, null, 2));
    if (!session?.user?.id) {
      setError('User session is not authenticated. Please log in.');
      return;
    }
    if (session?.user?.role !== 'admin') {
      setError('Access denied. Admin role required.');
      return;
    }
    fetchConflictReports();
  }, [session]);

  const fetchConflictReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/conflict-reports');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch conflict reports');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid conflict report data received');
      }
      console.log('Conflict reports fetched in component:', JSON.stringify(data, null, 2));
      setConflictReports(data);
    } catch (error) {
      console.error('Error fetching conflict reports:', error);
      setError(`Failed to load conflict reports: ${error.message}`);
      setConflictReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this conflict report?')) return;
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/conflict-reports?id=${reportId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete conflict report');
      }
      setConflictReports(conflictReports.filter((report) => report._id !== reportId));
    } catch (error) {
      console.error('Error deleting conflict report:', error);
      setError(`Failed to delete conflict report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user?.id) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Please log in to view conflict reports.
        </Typography>
      </Box>
    );
  }

  if (session?.user?.role !== 'admin') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Access denied. Admin role required.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Conflict Reports
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#d3d3d3' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Datesheet Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Reported By</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : conflictReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No conflict reports found
                </TableCell>
              </TableRow>
            ) : (
              conflictReports.map((report, index) => (
                <TableRow
                  key={report._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? 'rgb(240, 240, 240)' : 'rgb(255, 228, 225)',
                  }}
                >
                  <TableCell>{report.datesheetName || 'N/A'}</TableCell>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>{report.description}</TableCell>
                  <TableCell>{report.reportedBy || 'Unknown'}</TableCell>
                  <TableCell>
                    {report.createdAt
                      ? format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleDelete(report._id)}
                      color="error"
                      title="Delete Report"
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}