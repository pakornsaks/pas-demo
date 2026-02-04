import { useState } from 'react'
import {
  Box,
  Collapse,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material'

const drawerWidth = 240

const menuSections = [
  {
    label: 'Users',
    items: ['Product', 'Underwriting', 'Operations']
  },
  {
    label: 'No-Code Configuration',
    items: [
      'Map insurer data to broker standards',
      'Configure underwriting rules',
      'Configure pricing tables',
      'Configure discounts',
      'Test configurations before activation',
      'Activate/deactivate with approval'
    ]
  }
]

function App() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Users: true,
    'No-Code Configuration': true
  })

  const handleToggle = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Menu
          </Typography>
        </Toolbar>
        <List>
          {menuSections.map((section) => {
            const isOpen = openSections[section.label]
            return (
              <Box key={section.label}>
                <ListItemButton onClick={() => handleToggle(section.label)}>
                  <ListItemText primary={section.label} />
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    {isOpen ? '▾' : '▸'}
                  </Box>
                </ListItemButton>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {section.items.map((item) => (
                      <ListItemButton key={item} sx={{ pl: 4 }}>
                        <ListItemText primary={item} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            )
          })}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Typography variant="h4">Hello World</Typography>
      </Box>
    </Box>
  )
}

export default App
