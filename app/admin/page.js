'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard({ role }) {
  const [datesheets, setDatesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userDepartment, setUserDepartment] = useState(null);

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate countdown to exam start date
  const getCountdown = useCallback((startDate) => {
    const now = currentTime;
    const examDate = new Date(startDate);
    const diffMs = examDate - now;

    if (diffMs <= 0) return { text: 'Exam has started', urgent: false };

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const urgent = diffMs < 24 * 60 * 60 * 1000; // Less than 24 hours
    let text;
    if (days > 0) {
      text = `Starts in ${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      text = `Starts in ${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      text = `Starts in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    return { text, urgent };
  }, [currentTime]);

  useEffect(() => {
    async function fetchDatesheetsAndDepartments() {
      try {
        // Fetch user department if role is student
        let departmentId = null;
        if (role === 'student') {
          const userRes = await fetch('/api/user');
          if (!userRes.ok) {
            throw new Error(`User fetch error! status: ${userRes.status}`);
          }
          const userData = await userRes.json();
          departmentId = userData.department;
          setUserDepartment(departmentId);
          console.log('Fetched user department:', departmentId);
        }

        // Fetch all datesheets
        const datesheetRes = await fetch('/api/datesheets');
        if (!datesheetRes.ok) {
          throw new Error(`Datesheets fetch error! status: ${datesheetRes.status}`);
        }
        const datesheetData = await datesheetRes.json();
        console.log('Fetched datesheets:', datesheetData);

        // Filter datesheets for students
        const filteredDatesheets = role === 'student'
          ? datesheetData.filter(ds => ds.departmentId === departmentId)
          : datesheetData;

        // Fetch department names for filtered datesheets
        const datesheetsWithDeptNames = await Promise.all(
          filteredDatesheets.map(async (ds) => {
            try {
              const deptRes = await fetch(`/api/departments/${ds.departmentId}`);
              if (!deptRes.ok) {
                console.warn(`Department fetch error for ID ${ds.departmentId}: ${deptRes.status}`);
                return { ...ds, departmentName: 'Unknown Department' };
              }
              const deptData = await deptRes.json();
              return { ...ds, departmentName: deptData.name || 'Unknown Department' };
            } catch (err) {
              console.error(`Failed to fetch department for ID ${ds.departmentId}:`, err);
              return { ...ds, departmentName: 'Unknown Department' };
            }
          })
        );

        setDatesheets(datesheetsWithDeptNames);
        console.log('Set datesheets with department names:', datesheetsWithDeptNames);
      } catch (err) {
        console.error('Failed to fetch datesheets:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDatesheetsAndDepartments();
  }, [role]);

  return (
    <div className="p-8  min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-extrabold text-gray-900 mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600"
      >
        Upcoming Exam Datesheets
      </motion.h1>

      {loading ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-green-700 text-center text-lg animate-pulse"
        >
          Loading...
        </motion.p>
      ) : datesheets.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-green-700 text-center text-lg"
        >
          No upcoming datesheets found.
        </motion.p>
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto">
          <AnimatePresence>
            {datesheets.map((ds, index) => {
              const { text: countdownText, urgent } = getCountdown(ds.startDate);
              return (
                <motion.div
                  key={ds._id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, delay: index * 0.15, type: 'spring', bounce: 0.3 }}
                  whileHover={{ scale: 1.03, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)' }}
                  className="relative bg-white bg-opacity-70 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-green-200 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-lime-50 opacity-40" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center">
                      <motion.div
                        className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Calendar className="w-7 h-7 text-white" />
                      </motion.div>
                      <div className="ml-5">
                        <p className="text-2xl font-bold text-gray-900">
                          {ds.name.split(' - Department')[0]} - {ds.departmentName}
                        </p>
                        <p className="text-sm text-green-600 font-medium">
                          {ds.examPeriod} Exam - {ds.academicYear}
                        </p>
                        <p className="text-sm text-green-600">
                          {new Date(ds.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <motion.p
                          className={`text-sm font-semibold flex items-center mt-2 ${
                            urgent ? 'text-red-600' : 'text-emerald-600'
                          }`}
                          animate={urgent ? { scale: [1, 1.1, 1] } : {}}
                          transition={urgent ? { repeat: Infinity, duration: 1.5 } : {}}
                        >
                          <Clock className="w-5 h-5 mr-2" />
                          <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-lime-100 rounded-full">
                            {countdownText}
                          </span>
                        </motion.p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/datesheets`}
                      className="flex items-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
                    >
                      View Details
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}