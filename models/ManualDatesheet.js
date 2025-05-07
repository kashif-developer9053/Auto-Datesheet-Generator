import mongoose from 'mongoose';

const manualDatesheetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  academicYear: { type: String, required: true },
  examPeriod: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  schedules: [
    {
      batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
      semester: { type: String, required: true },
      examTimings: [{ startTime: String, endTime: String }],
      schedule: [
        {
          date: { type: Date, required: true },
          courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
          courseCode: { type: String },
          courseName: { type: String },
          totalStudents: { type: Number, default: 30 },
          timing: { startTime: String, endTime: String },
          roomAssignments: [
            {
              roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
              roomName: { type: String },
              facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
              facultyName: { type: String },
              assignedStudents: { type: Number },
            },
          ],
        },
      ],
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.ManualDatesheet || mongoose.model('ManualDatesheet', manualDatesheetSchema);