'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Typography, Box, Button, Alert, CircularProgress } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ViewDatesheets from './ViewDatesheets';
import CreateDatesheet from './CreateDatesheet';

export default function DatesheetGenerator() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [batchesByDept, setBatchesByDept] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState({});
  const [openCreate, setOpenCreate] = useState(false);

  // Redirect if no session or invalid role
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !['admin', 'faculty', 'student'].includes(session.user.role)) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Fetch departments
  useEffect(() => {
    async function fetchDepartments() {
      setLoadingDepartments(true);
      setError('');
      try {
        const response = await fetch('/api/departments');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch departments');
        if (!Array.isArray(data)) throw new Error('Invalid department data received');
        setDepartments(data);
        console.log('Departments loaded:', JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('Department fetch error:', error);
        setError('Failed to load departments. Please try again.');
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    }
    fetchDepartments();
  }, []);

  // Fetch batches for a department
  const fetchBatches = async (departmentId) => {
    if (!departmentId) return;
    setLoadingBatches((prev) => ({ ...prev, [departmentId]: true }));
    setError('');
    try {
      const response = await fetch(`/api/batches?departmentId=${departmentId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch batches');
      setBatchesByDept((prev) => ({
        ...prev,
        [departmentId]: Array.isArray(data) ? data : [],
      }));
      console.log(`Batches for dept ${departmentId}:`, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Batch fetch error:', error);
      setError('Failed to load batches. Please try again.');
      setBatchesByDept((prev) => ({ ...prev, [departmentId]: [] }));
    } finally {
      setLoadingBatches((prev) => ({ ...prev, [departmentId]: false }));
    }
  };

  if (!session || !['admin', 'faculty', 'student'].includes(session.user.role)) {
    return null;
  }

  return (
    <Container  maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" className='text-green-600'>
          Datesheets Management
        </Typography>
        {(session.user.role === 'admin' || session.user.role === 'faculty') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleIcon />}
            onClick={() => setOpenCreate(true)}
          >
            Create Datesheet
          </Button>
        )}
      </Box>

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

      <ViewDatesheets
        session={session}
        setError={setError}
        setSuccess={setSuccess}
        fetchBatches={fetchBatches}
      />

      {(session.user.role === 'admin' || session.user.role === 'faculty') && (
        <CreateDatesheet
          open={openCreate}
          setOpen={setOpenCreate}
          departments={departments}
          batchesByDept={batchesByDept}
          loadingDepartments={loadingDepartments}
          loadingBatches={loadingBatches}
          fetchBatches={fetchBatches}
          setError={setError}
          setSuccess={setSuccess}
          onDatesheetCreated={() => {
            // Trigger refetch in ViewDatesheets (handled via prop or context if needed)
            setSuccess('Datesheet created successfully!');
          }}
        />
      )}
    </Container>
  );
}