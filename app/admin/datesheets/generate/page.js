'use client';
import DatesheetGeneratorForm from '../../../components/DatesheetGeneratorForm';
import { Box, Container, Typography } from '@mui/material';

export default function GenerateDatesheet() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Datesheet Generator
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Generate exam datesheets by selecting department, semester, and date range.
        </Typography>
        <DatesheetGeneratorForm />
      </Box>
    </Container>
  );
} 