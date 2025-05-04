import { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Book as BookIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarTodayIcon,
  Groups as GroupsIcon,
  MeetingRoom as MeetingRoomIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
  { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Department Management', icon: <BusinessIcon />, path: '/admin/departments' },
  { text: 'Course Management', icon: <BookIcon />, path: '/admin/courses' },
  { text: 'Batch Management', icon: <GroupsIcon />, path: '/admin/batches' },
  { text: 'Room Management', icon: <MeetingRoomIcon />, path: '/admin/rooms' },
  { text: 'Datesheet Management', icon: <CalendarTodayIcon />, path: '/admin/datesheets' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? 240 : 60,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? 240 : 60,
            boxSizing: 'border-box',
            backgroundColor: '#1a237e',
            color: 'white',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
          >
            <MenuIcon />
          </IconButton>
          {open && (
            <Typography variant="h6" noWrap component="div" sx={{ ml: 2 }}>
              Admin Panel
            </Typography>
          )}
        </Box>
        <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => router.push(item.path)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
                backgroundColor: router.pathname === item.path ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                {item.icon}
              </ListItemIcon>
              {open && <ListItemText primary={item.text} />}
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  );
} 