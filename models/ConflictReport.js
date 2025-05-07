import mongoose from 'mongoose';

const conflictReportSchema = new mongoose.Schema({
  datesheetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Datesheet',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  reportedBy: {
    type: String, // Changed to String
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.ConflictReport || mongoose.model('ConflictReport', conflictReportSchema);