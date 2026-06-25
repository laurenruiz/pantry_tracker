'use client'
import Image from "next/image";
import { useState, useEffect } from 'react'
import { firestore } from '@/firebase'
import { Box, Modal, Stack, TextField, Button, IconButton, Typography } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import { collection, doc, deleteDoc, getDocs, getDoc, query, setDoc } from "firebase/firestore";

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editItemName, setEditItemName] = useState('')
  const [editNewName, setEditNewName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data()
      })
      setInventory(inventoryList)
    })
  }

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
    } else {
      await setDoc(docRef, { quantity: 1 })
    }
    await updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity == 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }
    await updateInventory()
  }

  const editItem = async (oldName, newName) => {
    if (!newName.trim() || newName === oldName) return
    const oldRef = doc(collection(firestore, 'inventory'), oldName)
    const oldSnap = await getDoc(oldRef)
    if (oldSnap.exists()) {
      const { quantity } = oldSnap.data()
      await deleteDoc(oldRef)
      await setDoc(doc(collection(firestore, 'inventory'), newName.trim()), { quantity })
    }
    await updateInventory()
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const handleEditOpen = (name) => { setEditItemName(name); setEditNewName(name); setEditOpen(true) }
  const handleEditClose = () => setEditOpen(false)

  const modalBoxSx = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    bgcolor: 'white',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  }

  const filterInventory = inventory.filter(({name}) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalBoxSx}>
          <Typography variant="h6">Add Item</Typography>
          <Stack sx={{ width: '100%' }} direction="row" spacing={2}>
            <TextField
              variant="outlined"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button variant="outlined" onClick={() => {
              addItem(itemName)
              setItemName('')
              handleClose()
            }}>
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Modal open={editOpen} onClose={handleEditClose}>
        <Box sx={modalBoxSx}>
          <Typography variant="h6">Edit Item Name</Typography>
          <Stack sx={{ width: '100%' }} direction="row" spacing={2}>
            <TextField
              variant="outlined"
              value={editNewName}
              onChange={(e) => setEditNewName(e.target.value)}
            />
            <Button variant="outlined" onClick={() => {
              editItem(editItemName, editNewName)
              handleEditClose()
            }}>
              Save
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Box sx={{ width: '100%', bgcolor: '#ADD8E6', py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h1" sx={{ color: '#333', fontWeight: 'bold' }}>Lauren's Lunchbox</Typography>
      </Box>
      <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>
      <Box sx={{ border: '1px solid #333' }}>
        <Box sx={{ width: '800px', height: '100px', bgcolor: '#ADD8E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack direction="row" spacing={2} sx={{ width: '100%', padding: 2 }}>
            <Typography variant="h4" color="#333" sx={{ width: '50%', display: 'flex', alignItems: 'center' }}>Inventory Items</Typography>
            <Box sx={{ width: '50%', height: '100px', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField variant="outlined" placeholder="Search..." sx={{ flexGrow: 1 }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </Box>
          </Stack>
        </Box>
        <Stack sx={{ width: '800px', height: '300px', overflow: 'auto' }} spacing={2}>
          {filterInventory.map(({ name, quantity }) => (
            <Box key={name} sx={{ width: '100%', minHeight: '150px', bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 5 }}>
              <Typography variant="h3" color="#333" sx={{ textAlign: 'center' }}>{name.charAt(0).toUpperCase() + name.slice(1)}</Typography>
              <Typography variant="h3" color="#333" sx={{ textAlign: 'center' }}>{quantity}</Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={() => addItem(name)}>Add</Button>
                <Button variant="contained" onClick={() => removeItem(name)}>Remove</Button>
                <IconButton size="small" onClick={() => handleEditOpen(name)}>
                  <EditIcon />
                </IconButton>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
