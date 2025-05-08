'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import CreateManualDatesheet from './CreateManualDatesheet';
import { Box, Typography, Button, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function ManualDatesheetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [manualOpen, setManualOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [batchesByDept, setBatchesByDept] = useState({});
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not authenticated or not admin/faculty
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !['admin', 'faculty'].includes(session.user?.role)) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const response = await fetch('/api/departments');
        if (!response.ok) throw new Error('Failed to fetch departments');
        const data = await response.json();
        console.log('Fetched departments:', data);
        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(`Failed to fetch departments: ${err.message}`);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch batches for a department
  const fetchBatches = useCallback(async (departmentId) => {
    if (!departmentId) {
      console.log('No departmentId provided, skipping batch fetch');
      return;
    }
    // Skip if batches already fetched for this department
    if (batchesByDept[departmentId]?.length > 0) {
      console.log(`Batches already fetched for department ${departmentId}, skipping`);
      return;
    }
    setLoadingBatches(true);
    try {
      const response = await fetch(`/api/batches?departmentId=${departmentId}`);
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      console.log('Fetched batches for department', departmentId, ':', data);
      setBatchesByDept((prev) => ({
        ...prev,
        [departmentId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(`Failed to fetch batches: ${err.message}`);
      setBatchesByDept((prev) => ({ ...prev, [departmentId]: [] }));
    } finally {
      setLoadingBatches(false);
    }
  }, [batchesByDept]);

  const handleDatesheetCreated = () => {
    setSuccess('Manual datesheet created successfully!');
    setManualOpen(false);
  };

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!session || !['admin', 'faculty'].includes(session.user?.role)) {
    return null; // Redirect handled by useEffect
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom color='black'>
        Create Manual Datesheet
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      <Button
        variant="contained"
        onClick={() => setManualOpen(true)}
        disabled={loadingDepartments || departments.length === 0}
      >
        Create Manual Datesheet
      </Button>
      <CreateManualDatesheet
        open={manualOpen}
        setOpen={setManualOpen}
        departments={departments}
        batchesByDept={batchesByDept}
        loadingDepartments={loadingDepartments}
        loadingBatches={loadingBatches}
        fetchBatches={fetchBatches}
        setError={setError}
        setSuccess={setSuccess}
        onDatesheetCreated={handleDatesheetCreated}
      />
    </Box>
  );
}