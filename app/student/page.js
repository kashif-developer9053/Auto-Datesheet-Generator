'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Grid,
} from '@mui/material';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export default function StudentDashboard() {
  const [dateSheets, setDateSheets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment && selectedSemester) {
      fetchDateSheets();
    }
  }, [selectedDepartment, selectedSemester]);

  const fetchDateSheets = async () => {
    try {
      const response = await fetch(`/api/datesheets?department=${selectedDepartment}&semester=${selectedSemester}`);
      const data = await response.json();
      setDateSheets(data);
    } catch (error) {
      console.error('Error fetching date sheets:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      dateSheets[0].schedule.map((item) => ({
        Date: new Date(item.date).toLocaleDateString(),
        Course: item.course.name,
        Room: item.room.name,
        Faculty: item.faculty.name,
        'Start Time': item.startTime,
        'End Time': item.endTime,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Date Sheet');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `date-sheet-${selectedDepartment}-sem${selectedSemester}.xlsx`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Student Dashboard
      </Typography>

      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                label="Department"
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
            <FormControl fullWidth>
              <InputLabel>Semester</InputLabel>
              <Select
                value={selectedSemester}
                onChange={handleSemesterChange}
                label="Semester"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    {sem}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {dateSheets.length > 0 && (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={downloadExcel}
            sx={{ mb: 2 }}
          >
            Download Excel
          </Button>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Faculty</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dateSheets[0].schedule.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>{item.course.name}</TableCell>
                    <TableCell>{item.room.name}</TableCell>
                    <TableCell>{item.faculty.name}</TableCell>
                    <TableCell>
                      {item.startTime} - {item.endTime}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
} 