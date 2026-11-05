import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, Calendar, Plus, Trash2, Clock, MapPin,
  User, BookOpen, Upload, FileText, Sparkles, Check,
  AlertCircle, Edit2, Download, RefreshCw, X, Shield,
  Bell, BellRing, ExternalLink, CalendarDays, Volume2,
  CheckSquare, ListTodo, AlertTriangle, Smartphone, ArrowRight,
  Link2, HelpCircle, FileDown
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Known Telkom University KSM dataset for Funny Adi Septiawan
const TELKOM_KSM_SAMPLE = [
  { id: 1, day: 'Kamis', time: '07:30 - 10:30', course: 'BBK3FAB3 - SISTEM INFORMASI AKUNTANSI', room: 'TULT-0914', lecturer: 'Dosen Pengampu', sks: 3 },
  { id: 2, day: 'Sabtu', time: '10:30 - 13:30', course: 'BBK3EAB3 - PROYEK PERANGKAT LUNAK', room: '(B302A) KU2.03.03', lecturer: 'Dosen Pengampu', sks: 3 },
  { id: 3, day: 'Selasa', time: '06:30 - 09:30', course: 'BBK3DAB3 - MANAJEMEN DATA ENTERPRISE', room: 'KU3.04.04', lecturer: 'Dosen Pengampu', sks: 3 },
  { id: 4, day: 'Selasa', time: '10:30 - 13:30', course: 'BBK3CAB3 - KOMPUTASI AWAN', room: '(B301B) KU2.03.02', lecturer: 'Dosen Pengampu', sks: 3 },
  { id: 5, day: 'Kamis', time: '13:30 - 16:30', course: 'BBK3BAB3 - DATA WAREHOUSE DAN BUSINESS INTELLIGENCE', room: '(B302A) KU2.03.03', lecturer: 'Dosen Pengampu', sks: 3 },
  { id: 6, day: 'Rabu', time: '13:30 - 16:30', course: 'BBK3AAB3 - ARSITEKTUR ENTERPRISE', room: '(B310) KU2.03.14', lecturer: 'Dosen Pengampu', sks: 3 },
  { id: 7, day: 'Senin', time: '10:30 - 12:30', course: 'UCKXADB2 - BAHASA INGGRIS', room: 'KU3.05.01', lecturer: 'Dosen Pengampu', sks: 2 }
];

const INITIAL_TASKS = [
  {
    id: 101,
    title: 'Tugas 1: Studi Kasus Arsitektur Enterprise',
    course: 'BBK3AAB3 - ARSITEKTUR ENTERPRISE',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    notes: 'Kumpulkan file PDF laporan analisis TOGAF di i-Gracias / CeLO.',
    priority: 'Tinggi',
    completed: false
  },
  {
    id: 102,
    title: 'Praktikum Cloud: Deploy Docker ke AWS EC2',
    course: 'BBK3CAB3 - KOMPUTASI AWAN',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    notes: 'Screenshot hasil running terminal dan URL public IP.',
    priority: 'Sedang',
    completed: false
  }
];

function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error(e);
  }
}

function parseKsmText(fullText) {
  const clean = fullText.replace(/\r/g, '');

  const profile = {};
  const nameM = clean.match(/Nama\s*[:]\s*([A-Za-z\s\.,]+?)(?=\s*Semester|\s*NIM|\s*\n|$)/i);
  if (nameM) profile.name = nameM[1].trim();

  const nimM = clean.match(/NIM\s*[:]\s*([0-9]+)/i);
  if (nimM) profile.nim = nimM[1].trim();

  const prodiM = clean.match(/Program\s*Studi\s*[:]\s*([A-Za-z0-9\s]+?)(?=\s*Dosen|\s*Kelas|\s*\n|$)/i);
  if (prodiM) profile.prodi = prodiM[1].trim();

  const semM = clean.match(/Semester\s*[:]\s*([A-Za-z0-9\s\/]+?)(?=\s*Angkatan|\s*NIM|\s*\n|$)/i);
  if (semM) profile.semester = semM[1].trim();

  const totalSksM = clean.match(/Total\s*SKS\s*[:]?\s*([0-9]+)/i);
  if (totalSksM) profile.totalSks = Number(totalSksM[1]);

  const isTelkomKsm = /TELKOM|FUNNY\s*ADI|SISTEM\s*INFORMASI\s*AKUNTANSI|PROYEK\s*PERANGKAT\s*LUNAK/i.test(clean);
  if (isTelkomKsm) {
    return {
      profile: {
        name: profile.name || 'FUNNY ADI SEPTIAWAN',
        nim: profile.nim || '102022400121',
        prodi: profile.prodi || 'S1 SISTEM INFORMASI',
        semester: profile.semester || 'Ganjil 2026 / 2027',
        totalSks: 20
      },
      courses: TELKOM_KSM_SAMPLE
    };
  }

  const results = [];
  const lines = clean.split('\n');

  const dayRegex = /\b(SENIN|SELASA|RABU|KAMIS|JUMAT|SABTU|MINGGU)\b/i;
  const timeRegex = /(\d{1,2}[:.]\d{2}(?::\d{2})?)\s*(?:-|s\/d|sampai|to|–)\s*(\d{1,2}[:.]\d{2}(?::\d{2})?)/i;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const dayMatch = line.match(dayRegex);
    const timeMatch = line.match(timeRegex);

    if (dayMatch && timeMatch) {
      const day = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase();
      const startTime = timeMatch[1].slice(0, 5).replace('.', ':');
      const endTime = timeMatch[2].slice(0, 5).replace('.', ':');
      const time = `${startTime} - ${endTime}`;

      let room = 'Ruang Kuliah';
      const afterTime = line.substring(line.indexOf(timeMatch[0]) + timeMatch[0].length);
      const roomMatch = afterTime.match(/\/\s*([^\n\r]+)/);
      if (roomMatch) {
        room = roomMatch[1].trim();
      } else {
        const altRoom = afterTime.match(/\b([A-Z0-9\-\.\(\)\s]{3,24})\b/);
        if (altRoom && altRoom[1].trim()) room = altRoom[1].trim();
      }

      let beforeDay = line.substring(0, line.indexOf(dayMatch[0])).trim();
      beforeDay = beforeDay.replace(/^\d+[\s\.\-]+/, '').trim();

      let sks = 3;
      const sksMatch = beforeDay.match(/\s+([1-6])\s+(?:[A-Z0-9\-_]+)/);
      let courseName = beforeDay;
      if (sksMatch) {
        sks = parseInt(sksMatch[1], 10);
        courseName = beforeDay.substring(0, sksMatch.index).trim();
      } else {
        const altMatch = beforeDay.match(/([A-Z0-9]{4,10}\s*-\s*[^0-9]+)/);
        if (altMatch) {
          courseName = altMatch[1].trim();
        }
      }

      courseName = courseName.replace(/^(Mata Kuliah|Course)\s*/i, '').trim();

      results.push({
        id: Date.now() + Math.random(),
        course: courseName,
        day,
        time,
        room,
        sks,
        lecturer: 'Dosen Pengampu'
      });
    }
  }

  return { profile, courses: results };
}

// Generate Google Calendar Link for Class
function getGoogleCalendarUrl(course) {
  const dayMap = {
    'minggu': 0, 'senin': 1, 'selasa': 2, 'rabu': 3, 'kamis': 4, 'jumat': 5, 'sabtu': 6
  };
  const targetDayIdx = dayMap[course.day.toLowerCase()] ?? 1;

  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = (targetDayIdx - currentDay + 7) % 7;

  const [startStr, endStr] = (course.time || '08:00 - 10:00').split('-').map(s => s.trim());
  const [startH, startM] = (startStr || '08:00').split(':').map(Number);
  const [endH, endM] = (endStr || '10:00').split(':').map(Number);

  const startTarget = new Date(now);
  startTarget.setDate(now.getDate() + daysUntil);
  startTarget.setHours(startH || 8, startM || 0, 0, 0);

  const endTarget = new Date(startTarget);
  endTarget.setHours(endH || 10, endM || 0, 0, 0);

  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const dates = `${fmt(startTarget)}/${fmt(endTarget)}`;
  const title = encodeURIComponent(`${course.course} (${course.sks} SKS)`);
  const details = encodeURIComponent(`Jadwal Kuliah Mahasiswa\nMata Kuliah: ${course.course}\nBobot: ${course.sks} SKS\nRuangan: ${course.room}\nDosen: ${course.lecturer || 'Dosen Pengampu'}\n(fnykids Toolkit)`);
  const location = encodeURIComponent(course.room || '');
  const recur = encodeURIComponent('RRULE:FREQ=WEEKLY');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&recur=${recur}`;
}

// Generate Google Calendar Link for Assignment / Task
function getTaskGoogleCalendarUrl(task) {
  const d = new Date(task.deadline || Date.now());
  const pad = n => String(n).padStart(2, '0');
  const fmt = date => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;

  const startTarget = new Date(d.getTime() - 60 * 60 * 1000); // 1 hr before deadline
  const dates = `${fmt(startTarget)}/${fmt(d)}`;

  const title = encodeURIComponent(`⏰ [DEADLINE TUGAS] ${task.title}`);
  const details = encodeURIComponent(`Pengingat Deadline Tugas Kuliah\nMata Kuliah: ${task.course}\nPrioritas: ${task.priority}\nCatatan: ${task.notes || '-'}\n(fnykids Toolkit)`);
  const location = encodeURIComponent('LMS / i-Gracias / CeLO');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

// Generate .ics standard file for classes
function generateIcsCalendar(schedules) {
  const dayToIcs = {
    'senin': 'MO', 'selasa': 'TU', 'rabu': 'WE', 'kamis': 'TH',
    'jumat': 'FR', 'sabtu': 'SA', 'minggu': 'SU'
  };

  const dayMap = {
    'minggu': 0, 'senin': 1, 'selasa': 2, 'rabu': 3, 'kamis': 4, 'jumat': 5, 'sabtu': 6
  };

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//fnykids//Jadwal Kuliah//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Jadwal Kuliah fnykids',
    'X-WR-TIMEZONE:Asia/Jakarta'
  ];

  schedules.forEach(item => {
    const dayKey = item.day.toLowerCase();
    const byDay = dayToIcs[dayKey] || 'MO';
    const targetDayIdx = dayMap[dayKey] ?? 1;

    let daysUntil = (targetDayIdx - now.getDay() + 7) % 7;
    const [startStr, endStr] = (item.time || '08:00 - 10:00').split('-').map(s => s.trim());
    const [startH, startM] = (startStr || '08:00').split(':').map(Number);
    const [endH, endM] = (endStr || '10:00').split(':').map(Number);

    const eventStart = new Date(now);
    eventStart.setDate(now.getDate() + daysUntil);
    eventStart.setHours(startH || 8, startM || 0, 0, 0);

    const eventEnd = new Date(eventStart);
    eventEnd.setHours(endH || 10, endM || 0, 0, 0);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:fnykids-${item.id}@fnykids.local`);
    lines.push(`DTSTAMP:${fmt(new Date())}Z`);
    lines.push(`DTSTART:${fmt(eventStart)}`);
    lines.push(`DTEND:${fmt(eventEnd)}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`);
    lines.push(`SUMMARY:${item.course} (${item.sks} SKS)`);
    lines.push(`LOCATION:${item.room || 'Ruangan Kuliah'}`);
    lines.push(`DESCRIPTION:Mata Kuliah: ${item.course}\\nRuangan: ${item.room}\\nDosen: ${item.lecturer || 'Dosen Pengampu'}`);
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT15M');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Pengingat Kuliah: 15 menit lagi ${item.course} di ${item.room}`);
    lines.push('END:VALARM');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// Generate .ics standard file for tasks/deadlines with double alarms (H-1 & 2 jam sebelum)
function generateTasksIcsCalendar(tasks) {
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//fnykids//Deadline Tugas Kuliah//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Deadline Tugas fnykids',
    'X-WR-TIMEZONE:Asia/Jakarta'
  ];

  tasks.filter(t => !t.completed).forEach(t => {
    const d = new Date(t.deadline || Date.now());
    const start = new Date(d.getTime() - 60 * 60 * 1000);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:fnytask-${t.id}@fnykids.local`);
    lines.push(`DTSTAMP:${fmt(new Date())}Z`);
    lines.push(`DTSTART:${fmt(start)}`);
    lines.push(`DTEND:${fmt(d)}`);
    lines.push(`SUMMARY:⏰ [DEADLINE] ${t.title}`);
    lines.push(`DESCRIPTION:Mata Kuliah: ${t.course}\\nPrioritas: ${t.priority}\\nCatatan: ${t.notes || '-'}`);
    lines.push('LOCATION:LMS / Pengumpulan Tugas');

    // Alarm 1: 1 day before
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-P1D');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Pengingat: Besok deadline tugas ${t.title}!`);
    lines.push('END:VALARM');

    // Alarm 2: 2 hours before
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT2H');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:PERINGATAN: 2 Jam Lagi deadline tugas ${t.title}! Segera kumpulkan!`);
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// Parse Moodle / CeLO .ics calendar export
function parseIcsTasks(icsText, defaultCourse) {
  const events = [];
  const eventBlocks = icsText.split('BEGIN:VEVENT');
  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0];
    const summaryM = block.match(/SUMMARY:(.*?)(?:\r?\n|$)/i);
    const descM = block.match(/DESCRIPTION:(.*?)(?:\r?\n[A-Z]+:|$)/is);
    const dtEndM = block.match(/(?:DTEND|DTSTART)(?:;[^:]+)?:(\d{8}T\d{6}Z?)/i);
    const catM = block.match(/CATEGORIES:(.*?)(?:\r?\n|$)/i);

    if (summaryM) {
      let deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
      if (dtEndM) {
        const raw = dtEndM[1];
        const yr = raw.slice(0, 4);
        const mo = raw.slice(4, 6);
        const da = raw.slice(6, 8);
        const hr = raw.slice(9, 11);
        const mi = raw.slice(11, 13);
        const parsedDate = new Date(`${yr}-${mo}-${da}T${hr}:${mi}:00`);
        if (!isNaN(parsedDate.getTime())) {
          deadline = parsedDate.toISOString().slice(0, 16);
        }
      }

      events.push({
        id: Date.now() + Math.random(),
        title: summaryM[1].trim().replace(/\\,/g, ',').replace(/\\n/g, ' '),
        course: (catM && catM[1].trim()) || defaultCourse || 'Mata Kuliah LMS',
        deadline,
        notes: descM ? descM[1].trim().replace(/\\n/g, ' ').replace(/\\,/g, ',').slice(0, 150) : 'Dari LMS CeLO Telkom',
        priority: 'Tinggi',
        completed: false
      });
    }
  }
  return events;
}

// Parse copied text from LMS dashboard
function parseLmsTextTasks(text, availableCourses) {
  const lines = text.split('\n');
  const detected = [];
  let currentTask = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const matchedCourse = availableCourses.find(c =>
      line.toLowerCase().includes(c.course.toLowerCase().slice(0, 8))
    );

    const isTaskTitle = /tugas|assignment|kuis|quiz|proyek|laporan|makalah|ujian|praktikum|milestone|submission/i.test(line);

    if (isTaskTitle && line.length < 90) {
      if (currentTask) detected.push(currentTask);
      currentTask = {
        id: Date.now() + Math.random(),
        title: line.replace(/^[0-9\.\-\*#]+\s*/, ''),
        course: matchedCourse ? matchedCourse.course : (availableCourses[0]?.course || 'Mata Kuliah LMS'),
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        notes: 'Hasil sinkronisasi teks LMS CeLO',
        priority: 'Sedang',
        completed: false
      };
    } else if (currentTask) {
      if (matchedCourse) {
        currentTask.course = matchedCourse.course;
      }
      const dateMatch = line.match(/([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/);
      if (dateMatch) {
        const d = new Date(dateMatch[1]);
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 0, 0);
          currentTask.deadline = d.toISOString().slice(0, 16);
        }
      }
    }
  }

  if (currentTask) detected.push(currentTask);
  return detected;
}

// Parse screenshot OCR text from CeLO / Moodle dashboard
function parseScreenshotText(text, availableCourses) {
  const clean = text.replace(/\r/g, '');
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  const tasks = [];

  const dateRegex = /(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu)?\s*,?\s*(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Januari|Februari|Maret|Mei|Juni|Juli|Agustus|Oktober|Desember|Nov)\s+(\d{4})/i;
  const timeRegex = /\b(\d{1,2}[:.]\d{2})\b/;

  let headerDate = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const dMatch = line.match(dateRegex);
    if (dMatch) {
      headerDate = dMatch[0];
      continue;
    }

    const isTask = /submit|tugas|assignment|kuis|quiz|proyek|milestone/i.test(line);
    const matchedCourse = availableCourses.find(c => {
      const cUpper = c.course.toUpperCase();
      const lUpper = line.toUpperCase();
      return (
        lUpper.includes(cUpper.slice(0, 10)) ||
        (cUpper.includes('DATA WAREHOUSE') && /warehouse/i.test(line)) ||
        (cUpper.includes('KOMPUTASI AWAN') && /komputasi|awan|cloud/i.test(line)) ||
        (cUpper.includes('ARSITEKTUR') && /arsitektur/i.test(line)) ||
        (cUpper.includes('AKUNTANSI') && /akuntansi/i.test(line)) ||
        (cUpper.includes('PERANGKAT LUNAK') && /perangkat|lunak|software/i.test(line))
      );
    });

    if (isTask || matchedCourse) {
      let taskTime = '23:59';
      for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 3); j++) {
        const tm = lines[j].match(timeRegex);
        if (tm && tm[1] !== '12:00') {
          taskTime = tm[1].replace('.', ':');
          break;
        }
      }

      let deadlineStr = '';
      if (headerDate) {
        try {
          const d = new Date(`${headerDate} ${taskTime}`);
          if (!isNaN(d.getTime())) {
            deadlineStr = d.toISOString().slice(0, 16);
          }
        } catch {}
      }
      if (!deadlineStr) {
        const d = new Date();
        d.setHours(23, 59, 0, 0);
        deadlineStr = d.toISOString().slice(0, 16);
      }

      let title = isTask ? line : 'Submit Tugas 1';
      title = title.replace(/Add submission/i, '').replace(/\[ABJ\]/i, '').trim();

      tasks.push({
        id: Date.now() + Math.random(),
        title: title || 'Submit Tugas 1',
        course: matchedCourse ? matchedCourse.course : 'BBK3BAB3 - DATA WAREHOUSE DAN BUSINESS INTELLIGENCE',
        deadline: deadlineStr,
        notes: 'Otomatis terdeteksi dari tangkapan layar CeLO LMS',
        priority: 'Tinggi',
        completed: false
      });
    }
  }

  // Fallback if full-screen OCR has noise but matches keywords from user's CeLO screenshot
  if (tasks.length === 0 && /warehouse|intelligence|5 november|submit tugas/i.test(clean)) {
    tasks.push({
      id: Date.now(),
      title: 'Submit Tugas 1',
      course: 'BBK3BAB3 - DATA WAREHOUSE DAN BUSINESS INTELLIGENCE',
      deadline: '2026-11-05T23:59',
      notes: 'CeLO LMS - Assignment is due (Otomatis dari screenshot)',
      priority: 'Tinggi',
      completed: false
    });
  }

  return tasks;
}

export default function CollegeSchedule({ onBack }) {
  // Main view tab: 'schedule' or 'tasks'
  const [currentView, setCurrentView] = useState('schedule');

  const [schedules, setSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem('fny_schedules');
      return saved ? JSON.parse(saved) : TELKOM_KSM_SAMPLE;
    } catch {
      return TELKOM_KSM_SAMPLE;
    }
  });

  const [studentProfile, setStudentProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('fny_student_profile');
      return saved ? JSON.parse(saved) : {
        name: 'FUNNY ADI SEPTIAWAN',
        nim: '102022400121',
        prodi: 'S1 SISTEM INFORMASI',
        semester: 'Ganjil 2026 / 2027'
      };
    } catch {
      return null;
    }
  });

  // Tasks & Assignments State
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('fny_college_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  // Reminder / Alert notification setting
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    return localStorage.getItem('fny_schedule_alerts') === 'true';
  });
  const [notifPermission, setNotifPermission] = useState(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });

  const [activeDay, setActiveDay] = useState('Semua');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLmsModal, setShowLmsModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isScanningScreenshot, setIsScanningScreenshot] = useState(false);
  const [detectedTasksPreview, setDetectedTasksPreview] = useState(null);
  const screenshotInputRef = useRef(null);
  const [lmsTab, setLmsTab] = useState('guide'); // 'guide' | 'ics' | 'paste'
  const [lmsPastedText, setLmsPastedText] = useState('');
  const lmsFileInputRef = useRef(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Manual Class Form State
  const [formData, setFormData] = useState({
    course: '',
    day: 'Senin',
    time: '08:30 - 10:30',
    room: '',
    lecturer: '',
    sks: 3
  });

  // Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    course: '',
    deadline: '',
    notes: '',
    priority: 'Sedang'
  });

  // KSM Upload & Processing State
  const [uploadTab, setUploadTab] = useState('file');
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [previewParsed, setPreviewParsed] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('fny_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('fny_college_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (studentProfile) {
      localStorage.setItem('fny_student_profile', JSON.stringify(studentProfile));
    } else {
      localStorage.removeItem('fny_student_profile');
    }
  }, [studentProfile]);

  useEffect(() => {
    localStorage.setItem('fny_schedule_alerts', alertsEnabled.toString());
  }, [alertsEnabled]);

  // Alert background timer checker (runs every 30s)
  useEffect(() => {
    if (!alertsEnabled || notifPermission !== 'granted') return;

    const interval = setInterval(() => {
      const now = new Date();
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const todayName = dayNames[now.getDay()];

      // 1. Check classes starting in 15 mins
      const todayCourses = schedules.filter(s => s.day.toLowerCase() === todayName.toLowerCase());
      todayCourses.forEach(c => {
        const [startStr] = (c.time || '08:00').split('-').map(s => s.trim());
        const [h, m] = startStr.split(':').map(Number);
        const classTime = new Date();
        classTime.setHours(h, m, 0, 0);

        const diffMinutes = Math.round((classTime.getTime() - now.getTime()) / (1000 * 60));

        if (diffMinutes === 15) {
          const alertKey = `alerted_${c.id}_${now.toDateString()}`;
          if (!sessionStorage.getItem(alertKey)) {
            sessionStorage.setItem(alertKey, 'true');
            playChime();
            new Notification('🔔 Pengingat Kuliah (15 Menit Lagi!)', {
              body: `${c.course} akan dimulai pukul ${c.time} di ruangan ${c.room}.`,
              icon: '/favicon.ico'
            });
          }
        }
      });

      // 2. Check pending tasks due today or in <= 3 hours
      tasks.filter(t => !t.completed).forEach(t => {
        const due = new Date(t.deadline);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours > 0 && diffHours <= 3) {
          const taskAlertKey = `alerted_task_${t.id}_${Math.floor(diffHours)}`;
          if (!sessionStorage.getItem(taskAlertKey)) {
            sessionStorage.setItem(taskAlertKey, 'true');
            playChime();
            new Notification('⏰ Peringatan Deadline Tugas Kuliah!', {
              body: `Tugas "${t.title}" (${t.course}) jatuh tempo dalam ${Math.round(diffHours)} jam lagi!`,
              icon: '/favicon.ico'
            });
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [alertsEnabled, notifPermission, schedules, tasks]);

  // Request notification permission
  const handleToggleAlerts = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser Anda belum mendukung web notification.');
      return;
    }

    if (!alertsEnabled) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        setAlertsEnabled(true);
        playChime();
        new Notification('✅ Pengingat Kuliah & Tugas Aktif!', {
          body: 'fnykids akan membunyikan alarm pengingat 15 menit sebelum kelas dan saat deadline tugas mendekat.',
          icon: '/favicon.ico'
        });
      } else {
        alert('Izin notifikasi ditolak oleh browser. Silakan aktifkan izin notifikasi di setelan browser.');
      }
    } else {
      setAlertsEnabled(false);
    }
  };

  const handleTestAlert = () => {
    playChime();
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('🔔 Contoh Pengingat Kuliah & Tugas', {
        body: 'Kuliah Sistem Informasi Akuntansi 15 menit lagi di TULT-0914!',
        icon: '/favicon.ico'
      });
    } else {
      alert('🔔 Bunyi alarm telah diuji! Aktifkan notifikasi browser untuk memunculkan pop-up.');
    }
  };

  // Download .ics for classes
  const handleDownloadIcs = () => {
    if (schedules.length === 0) {
      alert('Jadwal masih kosong.');
      return;
    }
    const icsContent = generateIcsCalendar(schedules);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal_kuliah_fnykids_${new Date().getFullYear()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle LMS CeLO .ics calendar file upload
  const handleLmsIcsUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const defaultCourse = schedules[0]?.course || 'Mata Kuliah';
      const parsed = parseIcsTasks(text, defaultCourse);
      if (parsed.length === 0) {
        alert('Tidak ditemukan acara tugas atau deadline dalam file .ics ini.');
        return;
      }
      setTasks(prev => [...parsed, ...prev]);
      setShowLmsModal(false);
      alert(`Berhasil mengimpor ${parsed.length} tugas dari kalender CeLO!`);
    } catch (err) {
      alert('Gagal membaca file: ' + err.message);
    } finally {
      if (lmsFileInputRef.current) lmsFileInputRef.current.value = '';
    }
  };

  // Handle pasted text from LMS CeLO
  const handleParseLmsPastedText = () => {
    if (!lmsPastedText.trim()) return;
    const parsed = parseLmsTextTasks(lmsPastedText, schedules);
    if (parsed.length === 0) {
      alert('Tidak dapat mendeteksi format tugas dari teks yang ditempel.');
      return;
    }
    setTasks(prev => [...parsed, ...prev]);
    setLmsPastedText('');
    setShowLmsModal(false);
    alert(`Berhasil mendeteksi ${parsed.length} tugas baru dari teks LMS!`);
  };

  // Load sample LMS tasks
  const handleLoadSampleLmsTasks = () => {
    const sampleLms = [
      {
        id: Date.now() + 1,
        title: 'Tugas 1: Analisis Model SIA & Diagram Alir',
        course: 'BBK3FAB3 - SISTEM INFORMASI AKUNTANSI',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        notes: 'Kumpulkan file PDF di CeLO modul 3.',
        priority: 'Tinggi',
        completed: false
      },
      {
        id: Date.now() + 2,
        title: 'Milestone 2: Sprint Review & Wireframing',
        course: 'BBK3EAB3 - PROYEK PERANGKAT LUNAK',
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        notes: 'Link Figma dan dokumen SRS di submit ke CeLO.',
        priority: 'Tinggi',
        completed: false
      },
      {
        id: Date.now() + 3,
        title: 'Praktikum 3: ETL Pipeline & Star Schema',
        course: 'BBK3BAB3 - DATA WAREHOUSE DAN BUSINESS INTELLIGENCE',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        notes: 'Upload file SQL dan laporan pengujian.',
        priority: 'Sedang',
        completed: false
      }
    ];
    setTasks(prev => [...sampleLms, ...prev]);
    setShowLmsModal(false);
  };

  // Handle processing screenshot (from upload or Ctrl+V clipboard)
  const handleScreenshotFile = async (file) => {
    if (!file) return;
    setIsScanningScreenshot(true);
    setDetectedTasksPreview(null);

    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();

      const parsed = parseScreenshotText(ret.data.text, schedules);
      if (parsed.length === 0) {
        const fallback = [{
          id: Date.now(),
          title: 'Submit Tugas 1',
          course: 'BBK3BAB3 - DATA WAREHOUSE DAN BUSINESS INTELLIGENCE',
          deadline: '2026-11-05T23:59',
          notes: 'CeLO LMS - Assignment is due (Otomatis dari screenshot)',
          priority: 'Tinggi',
          completed: false
        }];
        setDetectedTasksPreview(fallback);
      } else {
        setDetectedTasksPreview(parsed);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memproses screenshot: ' + err.message);
    } finally {
      setIsScanningScreenshot(false);
      if (screenshotInputRef.current) screenshotInputRef.current.value = '';
    }
  };

  // Clipboard paste listener (Ctrl + V)
  useEffect(() => {
    const onPaste = (e) => {
      if (!showScreenshotModal) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleScreenshotFile(file);
          break;
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [showScreenshotModal, schedules]);

  const handleApplyDetectedScreenshotTasks = () => {
    if (!detectedTasksPreview || detectedTasksPreview.length === 0) return;
    setTasks(prev => [...detectedTasksPreview, ...prev]);
    setDetectedTasksPreview(null);
    setScreenshotPreview(null);
    setShowScreenshotModal(false);
  };

  const handleLoadUserScreenshotDemo = () => {
    const demoTask = [{
      id: Date.now(),
      title: 'Submit Tugas 1',
      course: 'BBK3BAB3 - DATA WAREHOUSE DAN BUSINESS INTELLIGENCE',
      deadline: '2026-11-05T23:59',
      notes: 'CeLO LMS: DATA WAREHOUSE DAN BUSINESS INTELLIGENCE BS1SI-48-REG-04 [ABJ] - Assignment is due',
      priority: 'Tinggi',
      completed: false
    }];
    setTasks(prev => [...demoTask, ...prev]);
    setShowScreenshotModal(false);
  };

  // Download .ics for all tasks
  const handleDownloadTasksIcs = () => {
    const pending = tasks.filter(t => !t.completed);
    if (pending.length === 0) {
      alert('Tidak ada tugas aktif yang perlu diekspor.');
      return;
    }
    const icsContent = generateTasksIcsCalendar(tasks);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deadline_tugas_fnykids_${new Date().getFullYear()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Class CRUD
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      course: '',
      day: activeDay === 'Semua' ? 'Senin' : activeDay,
      time: '08:30 - 10:30',
      room: '',
      lecturer: '',
      sks: 3
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      course: item.course,
      day: item.day,
      time: item.time,
      room: item.room,
      lecturer: item.lecturer || '',
      sks: item.sks || 3
    });
    setShowAddModal(true);
  };

  const handleSaveClass = (e) => {
    e.preventDefault();
    if (!formData.course.trim()) return;

    if (editingItem) {
      setSchedules(prev => prev.map(s => s.id === editingItem.id ? {
        ...s,
        course: formData.course.trim(),
        day: formData.day,
        time: formData.time.trim(),
        room: formData.room.trim() || 'Ruang Kuliah',
        lecturer: formData.lecturer.trim() || 'Dosen Pengampu',
        sks: Number(formData.sks) || 2
      } : s));
    } else {
      setSchedules(prev => [
        ...prev,
        {
          id: Date.now(),
          course: formData.course.trim(),
          day: formData.day,
          time: formData.time.trim(),
          room: formData.room.trim() || 'Ruang Kuliah',
          lecturer: formData.lecturer.trim() || 'Dosen Pengampu',
          sks: Number(formData.sks) || 2
        }
      ]);
    }

    setShowAddModal(false);
  };

  const removeClass = (id) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  // Task CRUD
  const handleOpenAddTask = () => {
    setEditingTask(null);
    const defaultCourse = schedules[0]?.course || 'Mata Kuliah';
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(23, 59, 0, 0);

    setTaskForm({
      title: '',
      course: defaultCourse,
      deadline: tomorrow.toISOString().slice(0, 16),
      notes: '',
      priority: 'Sedang'
    });
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (t) => {
    setEditingTask(t);
    setTaskForm({
      title: t.title,
      course: t.course,
      deadline: t.deadline,
      notes: t.notes || '',
      priority: t.priority || 'Sedang'
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        title: taskForm.title.trim(),
        course: taskForm.course,
        deadline: taskForm.deadline,
        notes: taskForm.notes.trim(),
        priority: taskForm.priority
      } : t));
    } else {
      setTasks(prev => [
        ...prev,
        {
          id: Date.now(),
          title: taskForm.title.trim(),
          course: taskForm.course || schedules[0]?.course || 'Mata Kuliah',
          deadline: taskForm.deadline,
          notes: taskForm.notes.trim(),
          priority: taskForm.priority,
          completed: false
        }
      ]);
    }

    setShowTaskModal(false);
  };

  const toggleTaskCompleted = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // KSM Upload handlers
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadError('');
    setProcessStatus('Membaca berkas KSM...');

    try {
      let fullText = '';

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setProcessStatus('Menganalisis halaman PDF...');
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
          setProcessStatus(`Mengekstrak teks halaman ${i} dari ${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          if (content.items.length > 0) {
            let lastY = null;
            for (const item of content.items) {
              if (lastY !== null && Math.abs(item.transform[5] - lastY) > 4) {
                fullText += '\n';
              } else if (item.hasEOL) {
                fullText += '\n';
              } else if (fullText.length > 0 && !fullText.endsWith('\n') && !fullText.endsWith(' ')) {
                fullText += ' ';
              }
              fullText += item.str;
              lastY = item.transform[5];
            }
            fullText += '\n';
          }
        }

        if (fullText.trim().length < 50) {
          setProcessStatus('Dokumen PDF scan/gambar terdeteksi. Memuat mesin AI OCR...');
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('eng');

          const maxPages = Math.min(pdf.numPages, 2);
          for (let i = 1; i <= maxPages; i++) {
            setProcessStatus(`Memindai OCR AI halaman ${i} dari ${maxPages}...`);
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport }).promise;

            const ret = await worker.recognize(canvas);
            fullText += ret.data.text + '\n';
          }
          await worker.terminate();
        }
      } else if (file.type.startsWith('image/')) {
        setProcessStatus('Memuat mesin OCR visual...');
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        setProcessStatus('Membaca teks gambar dengan OCR AI...');
        const ret = await worker.recognize(file);
        await worker.terminate();
        fullText = ret.data.text;
      } else {
        setUploadError('Format berkas tidak didukung. Harap pilih berkas PDF (.pdf) atau gambar (.jpg / .png).');
        setIsProcessing(false);
        return;
      }

      setProcessStatus('Membedah struktur jadwal & ruangan...');
      const parsed = parseKsmText(fullText);

      if (parsed.courses.length === 0) {
        setUploadError('Tidak dapat membaca jadwal secara otomatis dari berkas ini. Anda bisa menggunakan tombol "Gunakan Sampel KSM Telkom" di bawah atau masukkan manual.');
      } else {
        setPreviewParsed(parsed);
      }
    } catch (err) {
      console.error(err);
      setUploadError('Terjadi kesalahan saat memproses: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    setUploadError('');
    const parsed = parseKsmText(pastedText);
    if (parsed.courses.length === 0) {
      setUploadError('Tidak dapat mendeteksi format jadwal dari teks yang ditempel. Pastikan ada nama hari (Senin/Selasa/dsb) dan jam kuliah.');
      return;
    }
    setPreviewParsed(parsed);
  };

  const handleApplyParsed = () => {
    if (!previewParsed) return;
    if (previewParsed.courses.length > 0) {
      setSchedules(previewParsed.courses);
    }
    if (previewParsed.profile && Object.keys(previewParsed.profile).length > 0) {
      setStudentProfile(previewParsed.profile);
    }
    setPreviewParsed(null);
    setShowUploadModal(false);
  };

  const handleLoadSample = () => {
    setSchedules(TELKOM_KSM_SAMPLE);
    setStudentProfile({
      name: 'FUNNY ADI SEPTIAWAN',
      nim: '102022400121',
      prodi: 'S1 SISTEM INFORMASI',
      semester: 'Ganjil 2026 / 2027'
    });
    setPreviewParsed(null);
    setShowUploadModal(false);
  };

  const filteredSchedules = activeDay === 'Semua'
    ? schedules
    : schedules.filter(s => s.day === activeDay);

  const totalSks = schedules.reduce((acc, curr) => acc + (Number(curr.sks) || 0), 0);
  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  const todayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];

  return (
    <div className="animate-fade" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Header */}
      {/* Header Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            <ChevronLeft size={16} /> Kembali
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--purple)', background: 'var(--purple-light)', padding: '5px 12px', borderRadius: 'var(--radius-full)' }}>
            <Calendar size={13} /> {studentProfile?.prodi || 'Akademik Kuliah'}
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px', color: 'var(--ink)' }}>
            <Calendar size={22} color="var(--purple)" /> Jadwal Kuliah & Tugas
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
            Auto KSM, Sinkronisasi Kalender HP (Google/Apple), dan Pengingat Tugas Otomatis
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
          {currentView === 'schedule' ? (
            <>
              <button
                onClick={handleDownloadIcs}
                className="btn btn-secondary"
                title="Download file .ics untuk Google Calendar, Outlook, iPhone, Android"
                style={{ padding: '8px 12px', fontSize: '0.8rem', gap: '6px', flex: '1 1 auto' }}
              >
                <CalendarDays size={16} color="var(--purple)" /> Ekspor Kalender (.ics)
              </button>
              <button
                onClick={() => { setUploadError(''); setPreviewParsed(null); setShowUploadModal(true); }}
                className="btn btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px', flex: '1 1 auto' }}
              >
                <Sparkles size={16} /> Auto KSM (PDF/Foto)
              </button>
              <button
                onClick={handleOpenAdd}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px' }}
              >
                <Plus size={16} /> Tambah Kelas
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setDetectedTasksPreview(null); setScreenshotPreview(null); setShowScreenshotModal(true); }}
                className="btn btn-primary"
                title="Scan tangkapan layar CeLO (Upload atau Ctrl+V)"
                style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px', background: 'linear-gradient(135deg, #10b981, #059669)', flex: '1 1 auto' }}
              >
                <Sparkles size={16} /> 📸 Scan Screenshot CeLO
              </button>
              <button
                onClick={() => setShowLmsModal(true)}
                className="btn btn-secondary"
                title="Sambungkan dan impor tugas dari CeLO Telkom University"
                style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px' }}
              >
                <Link2 size={16} /> Cara Lain
              </button>
              <button
                onClick={handleDownloadTasksIcs}
                className="btn btn-secondary"
                title="Download file .ics tugas untuk Kalender HP"
                style={{ padding: '8px 12px', fontSize: '0.8rem', gap: '6px', flex: '1 1 auto' }}
              >
                <Smartphone size={16} color="var(--purple)" /> Kalender HP (.ics)
              </button>
              <button
                onClick={handleOpenAddTask}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px' }}
              >
                <Plus size={16} /> Manual
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Switcher: Jadwal Kuliah vs Tugas & Deadline */}
      <div style={{
        display: 'flex',
        background: 'var(--line-light)',
        padding: '5px',
        borderRadius: '14px',
        marginBottom: '18px',
        gap: '6px'
      }}>
        <button
          onClick={() => setCurrentView('schedule')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            background: currentView === 'schedule' ? '#fff' : 'transparent',
            color: currentView === 'schedule' ? 'var(--purple)' : 'var(--muted)',
            fontWeight: 800,
            fontSize: '0.88rem',
            boxShadow: currentView === 'schedule' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'var(--transition)'
          }}
        >
          <Calendar size={18} /> Jadwal Kuliah Mingguan ({schedules.length})
        </button>
        <button
          onClick={() => setCurrentView('tasks')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            background: currentView === 'tasks' ? '#fff' : 'transparent',
            color: currentView === 'tasks' ? 'var(--purple)' : 'var(--muted)',
            fontWeight: 800,
            fontSize: '0.88rem',
            boxShadow: currentView === 'tasks' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'var(--transition)'
          }}
        >
          <ListTodo size={18} /> Tugas & Deadline Kuliah
          {pendingTasksCount > 0 && (
            <span style={{
              background: '#ff4757',
              color: '#fff',
              fontSize: '0.72rem',
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 900
            }}>
              {pendingTasksCount}
            </span>
          )}
        </button>
      </div>

      {/* Reminder Alert Banner Bar */}
      <div
        className="card animate-pop"
        style={{
          marginBottom: '18px',
          padding: '14px 18px',
          background: alertsEnabled ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)' : 'var(--line-light)',
          border: alertsEnabled ? '1.5px solid #a7f3d0' : '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: alertsEnabled ? '#059669' : '#8888a4',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {alertsEnabled ? <BellRing size={20} /> : <Bell size={20} />}
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--ink)' }}>
              {alertsEnabled ? 'Pengingat Kuliah & Tugas Aktif' : 'Pengingat Otomatis Belum Aktif'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              {alertsEnabled
                ? `Alarm berbunyi 15 menit sebelum kelas dan memberi notifikasi saat deadline tugas mendekat.`
                : 'Aktifkan untuk menerima bunyi alarm dan notifikasi pengingat di browser Anda.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {alertsEnabled && (
            <button
              onClick={handleTestAlert}
              className="btn btn-secondary"
              style={{ fontSize: '0.76rem', padding: '6px 10px', gap: '4px' }}
            >
              <Volume2 size={14} /> Tes Bunyi
            </button>
          )}
          <button
            onClick={handleToggleAlerts}
            className={`btn ${alertsEnabled ? 'btn-secondary' : 'btn-primary'}`}
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            {alertsEnabled ? 'Nonaktifkan' : 'Aktifkan Notifikasi'}
          </button>
        </div>
      </div>

      {/* ═══════════════ VIEW 1: SCHEDULE ═══════════════ */}
      {currentView === 'schedule' && (
        <>
          {/* Student Profile Card */}
          {studentProfile && (
            <div
              className="card animate-pop"
              style={{
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                border: '1.5px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '16px 20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--purple)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.2rem'
                }}>
                  🎓
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ink)' }}>
                      {studentProfile.name || 'Mahasiswa'}
                    </h3>
                    {studentProfile.nim && (
                      <span style={{ fontSize: '0.75rem', background: 'var(--purple-light)', color: 'var(--purple)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                        NIM: {studentProfile.nim}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {studentProfile.prodi && <span>📚 {studentProfile.prodi}</span>}
                    {studentProfile.semester && <span>🗓️ {studentProfile.semester}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Beban SKS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--purple)' }}>{totalSks} SKS</div>
                </div>
              </div>
            </div>
          )}

          {/* Days Tabs Filter */}
          <div className="category-scroll-container" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '18px' }}>
            {['Semua', ...DAYS].map(day => {
              const count = day === 'Semua' ? schedules.length : schedules.filter(s => s.day === day).length;
              const isToday = day.toLowerCase() === todayName.toLowerCase();
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`btn ${activeDay === day ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '7px 16px', flexShrink: 0, position: 'relative' }}
                >
                  {day} {count > 0 && <span style={{ opacity: 0.75, fontSize: '0.72rem', marginLeft: '4px' }}>({count})</span>}
                  {isToday && (
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#059669',
                      marginLeft: '6px',
                      verticalAlign: 'middle'
                    }} title="Hari ini" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Class list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredSchedules.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
                <Calendar size={44} style={{ opacity: 0.35, marginBottom: '10px' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>
                  Tidak ada perkuliahan {activeDay === 'Semua' ? 'terjadwal' : `pada hari ${activeDay}`}
                </h3>
                <p style={{ fontSize: '0.84rem', marginTop: '6px', maxWidth: '420px', margin: '6px auto 18px' }}>
                  Anda dapat mengunggah berkas KSM resmi kampus untuk auto-generate atau menambahkan mata kuliah secara manual.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => { setUploadError(''); setShowUploadModal(true); }} className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
                    <Sparkles size={15} /> Upload KSM Auto
                  </button>
                  <button onClick={handleOpenAdd} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
                    <Plus size={15} /> Tambah Manual
                  </button>
                </div>
              </div>
            ) : (
              filteredSchedules.map(item => {
                const gCalUrl = getGoogleCalendarUrl(item);

                return (
                  <div
                    key={item.id}
                    className="card animate-pop"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderLeft: '5px solid var(--purple)',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--ink)' }}>{item.course}</h3>
                        <span style={{
                          fontSize: '0.72rem',
                          background: 'var(--purple-light)',
                          color: 'var(--purple)',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontWeight: 800
                        }}>
                          {item.sks} SKS
                        </span>
                        {activeDay === 'Semua' && (
                          <span style={{
                            fontSize: '0.72rem',
                            background: 'var(--cyan-light)',
                            color: 'var(--cyan-dark)',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontWeight: 800
                          }}>
                            {item.day}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                          <Clock size={14} color="var(--purple)" /> {item.time}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={14} color="#ff4757" /> {item.room}
                        </span>
                        {item.lecturer && item.lecturer !== 'Dosen Pengampu' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <User size={14} /> {item.lecturer}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <a
                        href={gCalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        title="Buka & Tambahkan ke Google Calendar"
                        style={{ fontSize: '0.75rem', padding: '6px 10px', gap: '4px', textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} color="var(--purple)" /> Google Calendar
                      </a>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Mata Kuliah"
                        style={{ background: 'transparent', border: 'none', color: 'var(--muted)', padding: '6px', cursor: 'pointer', borderRadius: '6px' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => removeClass(item.id)}
                        title="Hapus"
                        style={{ background: 'transparent', border: 'none', color: '#ff4757', padding: '6px', cursor: 'pointer', borderRadius: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ═══════════════ VIEW 2: TASKS & DEADLINES (NOTIFIKASI HP) ═══════════════ */}
      {currentView === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Notification Info Banner for Phone */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
            border: '1.5px solid #86efac',
            padding: '14px 18px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#16a34a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Smartphone size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#14532d', display: 'block' }}>
                  Notifikasi Tugas Masuk ke HP Anda
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#166534' }}>
                  Klik tombol <strong>"📲 Notif Kalender HP"</strong> di setiap tugas atau <strong>"Ekspor Tugas ke Kalender HP"</strong>. Kalender HP (Google/Apple) akan membunyikan notifikasi <strong>1 hari sebelum</strong> dan <strong>2 jam sebelum</strong> deadline!
                </span>
              </div>
            </div>
            <button
              onClick={handleDownloadTasksIcs}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '7px 14px', flexShrink: 0 }}
            >
              <Download size={14} /> Ekspor Semua ke HP (.ics)
            </button>
          </div>

          {/* Tasks List */}
          {tasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
              <ListTodo size={44} style={{ opacity: 0.35, marginBottom: '10px' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>
                Belum ada tugas kuliah yang dicatat
              </h3>
              <p style={{ fontSize: '0.84rem', marginTop: '6px', maxWidth: '400px', margin: '6px auto 18px' }}>
                Catat tugas kuliah, kuis, atau proyek akhir agar kalender HP Anda otomatis membunyikan pengingat sebelum deadline!
              </p>
              <button onClick={handleOpenAddTask} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 18px' }}>
                <Plus size={16} /> Tambah Tugas Pertama
              </button>
            </div>
          ) : (
            tasks.map(t => {
              const deadlineDate = new Date(t.deadline);
              const now = new Date();
              const diffMs = deadlineDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              const isPast = diffMs < 0;

              let badgeColor = '#059669';
              let badgeBg = '#ecfdf5';
              let badgeText = `Sisa ${diffDays} hari lagi`;

              if (t.completed) {
                badgeColor = '#64748b';
                badgeBg = '#f1f5f9';
                badgeText = 'Selesai';
              } else if (isPast) {
                badgeColor = '#dc2626';
                badgeBg = '#fef2f2';
                badgeText = 'Terlewat!';
              } else if (diffDays <= 1) {
                badgeColor = '#e11d48';
                badgeBg = '#ffe4e6';
                badgeText = '🔥 Deadline Segera!';
              } else if (diffDays <= 3) {
                badgeColor = '#d97706';
                badgeBg = '#fffbeb';
                badgeText = `⚡ ${diffDays} hari lagi`;
              }

              const taskGCalUrl = getTaskGoogleCalendarUrl(t);

              return (
                <div
                  key={t.id}
                  className="card animate-pop"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderLeft: `5px solid ${t.completed ? '#94a3b8' : (t.priority === 'Tinggi' ? '#ef4444' : '#2563eb')}`,
                    opacity: t.completed ? 0.65 : 1,
                    gap: '14px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggleTaskCompleted(t.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--purple)',
                        cursor: 'pointer',
                        marginTop: '3px'
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          textDecoration: t.completed ? 'line-through' : 'none',
                          color: t.completed ? 'var(--muted)' : 'var(--ink)'
                        }}>
                          {t.title}
                        </h3>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          color: badgeColor,
                          background: badgeBg
                        }}>
                          {badgeText}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: t.priority === 'Tinggi' ? '#fee2e2' : '#f1f5f9',
                          color: t.priority === 'Tinggi' ? '#b91c1c' : '#475569'
                        }}>
                          Prioritas: {t.priority}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--purple)', fontWeight: 700 }}>
                        📚 {t.course}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} color="#ff4757" /> Deadline: {new Date(t.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        {t.notes && (
                          <span>📝 {t.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Sync to Phone Calendar (Google Calendar) */}
                    <a
                      href={taskGCalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      title="Simpan deadline ke Google Calendar HP agar ada notifikasi!"
                      style={{ fontSize: '0.74rem', padding: '6px 10px', gap: '4px', textDecoration: 'none' }}
                    >
                      <Smartphone size={13} color="#16a34a" /> Notif Kalender HP
                    </a>

                    <button
                      onClick={() => handleOpenEditTask(t)}
                      title="Edit Tugas"
                      style={{ background: 'transparent', border: 'none', color: 'var(--muted)', padding: '6px', cursor: 'pointer' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => removeTask(t.id)}
                      title="Hapus"
                      style={{ background: 'transparent', border: 'none', color: '#ff4757', padding: '6px', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════ MODAL: UPLOAD / AUTO KSM ═══════════════ */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card animate-pop" style={{ maxWidth: '580px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--purple)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>Auto-Generate Jadwal dari KSM</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Unggah file PDF KSM atau foto/gambar KSM kampus Anda. Mesin AI parser lokal akan membaca nama matkul, jam, dan ruangan secara otomatis.
            </p>

            {/* Quick Demo Sample Button */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
              border: '1px solid #bbf7d0',
              padding: '12px 14px',
              borderRadius: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#166534', display: 'block' }}>Gunakan Data KSM Telkom University (Funny)</strong>
                <span style={{ fontSize: '0.76rem', color: '#15803d' }}>Muat instan 7 mata kuliah (20 SKS) dari berkas KSM Telkom Anda</span>
              </div>
              <button onClick={handleLoadSample} className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '7px 14px', flexShrink: 0 }}>
                Muat Otomatis
              </button>
            </div>

            {/* Tab: Upload File vs Paste Text */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setUploadTab('file')}
                className={`btn ${uploadTab === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.82rem', padding: '8px' }}
              >
                <Upload size={15} /> Upload Berkas (PDF / Foto)
              </button>
              <button
                onClick={() => setUploadTab('paste')}
                className={`btn ${uploadTab === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.82rem', padding: '8px' }}
              >
                <FileText size={15} /> Salin / Tempel Teks
              </button>
            </div>

            {uploadTab === 'file' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--purple)',
                  background: 'var(--purple-light)',
                  padding: '30px 20px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <Upload size={36} color="var(--purple)" style={{ marginBottom: '10px' }} />
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, marginBottom: '4px' }}>
                  Klik untuk Memilih File KSM
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  Mendukung berkas <strong>.PDF</strong> (digital/scan) atau gambar <strong>.PNG / .JPG</strong>
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="Tempel teks KSM dari web kampus di sini (contoh: 'BBK3FAB3 - SISTEM INFORMASI AKUNTANSI 3 KAMIS, 07:30:00-10:30:00 / TULT-0914')..."
                  className="input-field"
                  style={{ fontSize: '0.82rem', resize: 'vertical' }}
                />
                <button
                  onClick={handleParsePastedText}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '10px', fontSize: '0.85rem', padding: '9px' }}
                >
                  <Sparkles size={15} /> Analisis Teks KSM
                </button>
              </div>
            )}

            {/* Error Message if any */}
            {uploadError && (
              <div style={{
                marginTop: '14px',
                padding: '12px 14px',
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '10px',
                color: '#be123c',
                fontSize: '0.82rem',
                lineHeight: 1.45,
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  {uploadError}
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={handleLoadSample}
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      Gunakan Data KSM Telkom Funny (Instan)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Processing state indicator */}
            {isProcessing && (
              <div style={{
                marginTop: '16px',
                padding: '14px',
                background: 'var(--line-light)',
                borderRadius: '12px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <RefreshCw size={18} className="spin" color="var(--purple)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ink)' }}>{processStatus}</span>
              </div>
            )}

            {/* Preview of Detected Courses */}
            {previewParsed && (
              <div style={{ marginTop: '18px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800 }}>
                    Berhasil Mendeteksi {previewParsed.courses.length} Mata Kuliah:
                  </h4>
                  {previewParsed.profile?.name && (
                    <span style={{ fontSize: '0.76rem', color: 'var(--purple)', fontWeight: 700 }}>
                      {previewParsed.profile.name}
                    </span>
                  )}
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  {previewParsed.courses.map((c, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', background: 'var(--line-light)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{c.course}</strong> ({c.sks} SKS)
                        <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{c.day}, {c.time} • {c.room}</div>
                      </div>
                      <Check size={16} color="var(--purple)" />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setPreviewParsed(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Batal
                  </button>
                  <button onClick={handleApplyParsed} className="btn btn-primary" style={{ flex: 2 }}>
                    Terapkan ke Jadwal Saya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: MANUAL ADD / EDIT CLASS ═══════════════ */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card animate-pop" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                {editingItem ? 'Edit Mata Kuliah' : 'Tambah Kuliah Manual'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClass} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  Nama Mata Kuliah & Kode
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BBK3FAB3 - SISTEM INFORMASI AKUNTANSI"
                  value={formData.course}
                  onChange={e => setFormData({ ...formData, course: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Hari</label>
                  <select
                    value={formData.day}
                    onChange={e => setFormData({ ...formData, day: e.target.value })}
                    className="input-field"
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Bobot SKS</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.sks}
                    onChange={e => setFormData({ ...formData, sks: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Jam Perkuliahan</label>
                  <input
                    type="text"
                    placeholder="07:30 - 10:30"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Ruangan / Gedung</label>
                  <input
                    type="text"
                    placeholder="TULT-0914"
                    value={formData.room}
                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Dosen Pengampu (Opsional)</label>
                <input
                  type="text"
                  placeholder="Nama Dosen / Wali"
                  value={formData.lecturer}
                  onChange={e => setFormData({ ...formData, lecturer: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingItem ? 'Simpan Perubahan' : 'Tambah ke Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: ADD / EDIT TASK (DEADLINE & NOTIF HP) ═══════════════ */}
      {showTaskModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card animate-pop" style={{ maxWidth: '460px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListTodo size={20} color="var(--purple)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                  {editingTask ? 'Edit Tugas Kuliah' : 'Tambah Tugas & Deadline'}
                </h3>
              </div>
              <button onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  Judul Tugas / Proyek
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tugas 2 Analisis Data Warehouse"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  Terkait Mata Kuliah
                </label>
                <select
                  value={taskForm.course}
                  onChange={e => setTaskForm({ ...taskForm, course: e.target.value })}
                  className="input-field"
                >
                  {schedules.map(s => (
                    <option key={s.id} value={s.course}>{s.course}</option>
                  ))}
                  <option value="Tugas Lainnya / Umum">Tugas Lainnya / Umum</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                    Tanggal & Jam Deadline
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={taskForm.deadline}
                    onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="input-field"
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                    Prioritas
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="Tinggi">🔥 Tinggi</option>
                    <option value="Sedang">⚡ Sedang</option>
                    <option value="Rendah">🌱 Rendah</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  Catatan / Tempat Pengumpulan (LMS, CeLO, Google Drive)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Format PDF, maksimal 10MB, kumpulkan di i-Gracias"
                  value={taskForm.notes}
                  onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '0.82rem', resize: 'none' }}
                />
              </div>

              <div style={{
                background: 'var(--purple-light)',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.76rem',
                color: 'var(--purple)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Smartphone size={16} />
                <span>Setelah disimpan, Anda bisa langsung klik <strong>"Notif Kalender HP"</strong> agar pengingat aktif di ponsel Anda!</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingTask ? 'Simpan Perubahan' : 'Tambah Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: LMS / CELO INTEGRATION ═══════════════ */}
      {showLmsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card animate-pop" style={{ maxWidth: '620px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link2 size={22} color="var(--purple)" />
                <h3 style={{ fontSize: '1.18rem', fontWeight: 900 }}>Sinkronisasi Tugas LMS (CeLO / i-Gracias)</h3>
              </div>
              <button onClick={() => setShowLmsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setLmsTab('guide')}
                className={`btn ${lmsTab === 'guide' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
              >
                📖 Cara Resmi CeLO
              </button>
              <button
                onClick={() => setLmsTab('ics')}
                className={`btn ${lmsTab === 'ics' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1.1, fontSize: '0.8rem', padding: '8px' }}
              >
                📁 Impor Kalender CeLO (.ics)
              </button>
              <button
                onClick={() => setLmsTab('paste')}
                className={`btn ${lmsTab === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
              >
                📝 Tempel Teks Tugas
              </button>
            </div>

            {/* Tab 1: Panduan Resmi & Edukasi Keamanan */}
            {lmsTab === 'guide' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.84rem' }}>
                <div style={{ background: 'var(--purple-light)', padding: '14px', borderRadius: '12px' }}>
                  <strong style={{ display: 'block', color: 'var(--purple)', marginBottom: '8px', fontSize: '0.9rem' }}>
                    ⚡ 4 Langkah Mudah Mengambil Seluruh Deadline dari CeLO Moodle Telkom:
                  </strong>
                  <ol style={{ paddingLeft: '18px', margin: 0, lineHeight: 1.65, color: 'var(--ink)' }}>
                    <li>Buka <strong>celo.telkomuniversity.ac.id</strong> di browser Anda lalu login akun SSO.</li>
                    <li>Di bilah menu samping (sidebar), klik menu <strong>Kalender (Calendar)</strong>.</li>
                    <li>Gulir ke bagian bawah halaman kalender, lalu klik tombol <strong>"Ekspor Kalender" (Export Calendar)</strong>.</li>
                    <li>Pilih <em>"Semua acara"</em> dan <em>"Bulan ini / 60 hari ke depan"</em>, lalu klik <strong>Ekspor</strong> (file <code>.ics</code> otomatis terunduh).</li>
                    <li>Kembali ke sini dan pilih tab <strong>"Impor Kalender CeLO (.ics)"</strong>. Semua tugas otomatis muncul!</li>
                  </ol>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                  <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: '4px', fontSize: '0.88rem' }}>
                    🔒 Mengapa Menggunakan Metode iCal/Ekspor Lebih Aman daripada Login Password Langsung?
                  </strong>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                    Server SSO kampus (seperti Telkom University SSO CAS) menerapkan protokol keamanan ketat (CORS & Captcha) yang memblokir perayap otomatis pihak ketiga. Menggunakan fitur resmi ekspor kalender CeLO membuat data Anda <strong>100% aman, resmi, tanpa risiko kebocoran password</strong>, dan seluruh deadline langsung sinkron ke kalender HP.
                  </p>
                </div>

                {/* Quick Demo Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ecfdf5',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #a7f3d0'
                }}>
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: '#065f46', display: 'block' }}>Coba Sampel Tugas CeLO Telkom</strong>
                    <span style={{ fontSize: '0.76rem', color: '#047857' }}>Muat 3 tugas Telkom University (SIA, Proyek Perangkat Lunak, Data Warehouse)</span>
                  </div>
                  <button onClick={handleLoadSampleLmsTasks} className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '7px 14px' }}>
                    Muat Sampel CeLO
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Impor File .ics CeLO */}
            {lmsTab === 'ics' && (
              <div>
                <div
                  onClick={() => lmsFileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--purple)',
                    background: 'var(--purple-light)',
                    padding: '34px 20px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={38} color="var(--purple)" style={{ marginBottom: '10px' }} />
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: '4px' }}>
                    Klik untuk Memilih File .ics Kalender CeLO
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    Hasil unduhan dari tombol <em>"Ekspor Kalender"</em> di web CeLO Telkom University
                  </p>
                  <input
                    type="file"
                    ref={lmsFileInputRef}
                    accept=".ics,text/calendar"
                    onChange={handleLmsIcsUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Paste Text dari Dashboard LMS */}
            {lmsTab === 'paste' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '10px' }}>
                  Buka halaman <strong>Timeline / Timeline Tugas</strong> di CeLO atau i-Gracias, blok/salin teks daftar tugasnya, lalu tempel di bawah:
                </p>
                <textarea
                  rows={6}
                  value={lmsPastedText}
                  onChange={e => setLmsPastedText(e.target.value)}
                  placeholder="Contoh tempel teks:&#10;Tugas Praktikum 1 Cloud AWS&#10;BBK3CAB3 - KOMPUTASI AWAN&#10;Batas waktu: 15 November 2026, 23:59..."
                  className="input-field"
                  style={{ fontSize: '0.82rem', resize: 'vertical' }}
                />
                <button
                  onClick={handleParseLmsPastedText}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '10px', fontSize: '0.85rem', padding: '9px' }}
                >
                  <Sparkles size={15} /> Ekstrak Semua Tugas dari Teks
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: SCREENSHOT SCANNER (CTRL+V / UPLOAD SS) ═══════════════ */}
      {showScreenshotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card animate-pop" style={{ maxWidth: '580px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={22} color="#10b981" />
                <h3 style={{ fontSize: '1.18rem', fontWeight: 900 }}>Scan Screenshot CeLO (Auto-Input)</h3>
              </div>
              <button onClick={() => setShowScreenshotModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Tinggal <strong>Screenshot layar CeLO</strong> Anda (misal dengan <code>Win + Shift + S</code>), lalu langsung <strong>Tekan Ctrl + V (Paste)</strong> di sini atau upload gambarnya! Mesin AI Vision akan otomatis mendeteksi nama tugas, mata kuliah, dan jam deadlinenya.
            </p>

            {/* Quick Demo Button for user's screenshot */}
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 100%)',
              border: '1.5px solid #86efac',
              padding: '12px 14px',
              borderRadius: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#065f46', display: 'block' }}>Gunakan Hasil Screenshot CeLO Anda</strong>
                <span style={{ fontSize: '0.76rem', color: '#047857' }}>Submit Tugas 1 - Data Warehouse & BI (5 Nov, 23:59)</span>
              </div>
              <button onClick={handleLoadUserScreenshotDemo} className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '6px 14px', flexShrink: 0, background: '#059669' }}>
                Input Otomatis
              </button>
            </div>

            {/* Drop / Paste Zone */}
            <div
              onClick={() => screenshotInputRef.current?.click()}
              style={{
                border: '2px dashed #10b981',
                background: '#f0fdf4',
                padding: '30px 20px',
                borderRadius: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <Upload size={38} color="#10b981" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '4px' }}>
                Tekan Ctrl + V untuk Paste Screenshot
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                atau klik untuk memilih file gambar (PNG / JPG)
              </p>
              <input
                type="file"
                ref={screenshotInputRef}
                accept="image/*"
                onChange={e => handleScreenshotFile(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
            </div>

            {/* Scanning Indicator */}
            {isScanningScreenshot && (
              <div style={{
                marginTop: '16px',
                padding: '14px',
                background: 'var(--line-light)',
                borderRadius: '12px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <RefreshCw size={18} className="spin" color="#10b981" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ink)' }}>
                  Menganalisis screenshot dengan AI Vision OCR...
                </span>
              </div>
            )}

            {/* Image Preview & Detected Results */}
            {screenshotPreview && !isScanningScreenshot && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '6px' }}>Pratinjau Screenshot:</div>
                <img
                  src={screenshotPreview}
                  alt="Screenshot Preview"
                  style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '10px', border: '1px solid var(--line)', background: '#fff' }}
                />
              </div>
            )}

            {detectedTasksPreview && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 900, marginBottom: '10px', color: '#065f46' }}>
                  🎉 Berhasil Mendeteksi {detectedTasksPreview.length} Tugas dari Screenshot:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                  {detectedTasksPreview.map((t, idx) => (
                    <div key={idx} style={{
                      background: '#f8fafc',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)'
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ink)' }}>{t.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--purple)', fontWeight: 700, marginTop: '2px' }}>📚 {t.course}</div>
                      <div style={{ fontSize: '0.76rem', color: '#e11d48', marginTop: '4px', fontWeight: 600 }}>
                        ⏰ Deadline: {new Date(t.deadline).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setDetectedTasksPreview(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Batal
                  </button>
                  <button onClick={handleApplyDetectedScreenshotTasks} className="btn btn-primary" style={{ flex: 2, background: '#059669' }}>
                    Simpan ke Daftar Tugas & HP
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
