'use client'
import Image from "next/image";
import { useState, useEffect, useRef } from 'react'
import { firestore } from '@/firebase'
import { Box, Modal, Stack, TextField, Button, IconButton, Typography } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import { collection, doc, deleteDoc, getDocs, getDoc, query, setDoc } from "firebase/firestore";
import confetti from 'canvas-confetti'
import ReactMarkdown from 'react-markdown'

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [editOpen, setEditOpen] = useState(false)
  const [editItemName, setEditItemName] = useState('')
  const [editNewName, setEditNewName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [recipe, setRecipe] = useState('')
  const [loadingRecipe, setLoadingRecipe] = useState(false)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const cameraInputRef = useRef(null)

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

  const addItem = async (item, qty = 1) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + qty })
    } else {
      await setDoc(docRef, { quantity: qty })
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

  const fireConfetti = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#FFE0EA', '#FFC0D4', '#ff69b4', '#ffffff', '#ffb3c6'] })
  }

  const getSuggestedRecipe = async () => {
    setRecipeModalOpen(false)
    setRecipe('')
    setLoadingRecipe(true)
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: inventory })
    })
    const data = await res.json()
    if (!res.ok && data.error === 'rate_limited') {
      setLoadingRecipe(false)
      alert('The recipe generator is busy right now — wait a moment and try again!')
      return
    }
    setRecipe(data.suggestion)
    setLoadingRecipe(false)
    setRecipeModalOpen(true)
    fireConfetti()
  }

  const handleScanItem = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setClassifying(true)
    try {
      const url = URL.createObjectURL(file)
      const img = new window.Image()
      img.src = url
      await new Promise(resolve => { img.onload = resolve })

      await import('@tensorflow/tfjs')
      const mobilenet = await import('@tensorflow-models/mobilenet')
      const model = await mobilenet.load({ version: 2, alpha: 1.0 })
      const predictions = await model.classify(img)
      URL.revokeObjectURL(url)

      const name = predictions[0].className.split(',')[0].toLowerCase().trim()
      setItemName(name)
      setItemQuantity(1)
      setOpen(true)
    } catch (err) {
      console.error('Classification error:', err)
      alert('Could not identify the item — try a clearer photo or add it manually.')
    } finally {
      setClassifying(false)
      e.target.value = ''
    }
  }

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
    <Box sx={{ width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
      {loadingRecipe && (
        <Box sx={{
          position: 'fixed', inset: 0, zIndex: 9999,
          bgcolor: 'rgba(255, 224, 234, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 3,
          animation: 'fadeIn 0.3s ease',
          '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
        }}>
          <Box sx={{
            animation: 'bounce 0.7s infinite alternate',
            '@keyframes bounce': { from: { transform: 'translateY(0px)' }, to: { transform: 'translateY(-20px)' } },
          }}>
            <Image src="/icon.png" alt="cooking" width={100} height={100} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c2185b', letterSpacing: 2 }}>
            Cooking...
          </Typography>
        </Box>
      )}
      <Modal open={recipeModalOpen} onClose={() => setRecipeModalOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '520px', maxHeight: '80vh', overflow: 'auto',
          bgcolor: 'white', border: '2px solid #FFC0D4',
          boxShadow: 24, p: 4, borderRadius: 3,
          display: 'flex', flexDirection: 'column', gap: 3,
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#c2185b' }}>
            Your Recipe
          </Typography>
          <Box sx={{
            '& h1, & h2, & h3': { color: '#c2185b', mt: 1, mb: 0.5 },
            '& p': { lineHeight: 1.8, mb: 1 },
            '& ul, & ol': { pl: 2.5, mb: 1 },
            '& li': { lineHeight: 1.8 },
            '& strong': { color: '#880e4f' },
          }}>
            <ReactMarkdown>{recipe}</ReactMarkdown>
          </Box>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={getSuggestedRecipe}>
              New Recipe
            </Button>
            <Button variant="contained" onClick={() => setRecipeModalOpen(false)}>
              Close
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Box sx={{ width: '100vw', bgcolor: '#FFE0EA', py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h1" sx={{ fontWeight: 'bold' }}>Lauren's Lunchbox</Typography>
      </Box>
      <Box sx={{ width: '100vw', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 2, backgroundImage: 'url(/pixel_bg.png)', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'top center' }}>
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalBoxSx}>
          <Typography variant="h6">Add Item</Typography>
          <TextField
            label="Item Name"
            variant="outlined"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <TextField
            label="Quantity"
            variant="outlined"
            fullWidth
            type="number"
            placeholder="1"
            value={itemQuantity}
            onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <Button variant="contained" fullWidth onClick={() => {
            addItem(itemName, itemQuantity)
            setItemName('')
            setItemQuantity(1)
            handleClose()
          }}>
            Add
          </Button>
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
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        style={{ display: 'none' }}
        onChange={handleScanItem}
      />
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={handleOpen}>
          Add New Item
        </Button>
        <Button
          variant="contained"
          onClick={() => cameraInputRef.current?.click()}
          disabled={classifying}
        >
          {classifying ? 'Scanning...' : 'Scan Item'}
        </Button>
        <Button variant="contained" onClick={getSuggestedRecipe} disabled={inventory.length === 0}>
          Suggest a Recipe
        </Button>
      </Stack>
      <Box sx={{ border: '1px solid #333' }}>
        <Box sx={{ width: '800px', height: '100px', bgcolor: '#FFC0D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack direction="row" spacing={2} sx={{ width: '100%', padding: 2 }}>
            <Typography variant="h4" color="text.primary" sx={{ width: '50%', display: 'flex', alignItems: 'center' }}>Inventory Items</Typography>
            <Box sx={{ width: '50%', height: '100px', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField variant="outlined" placeholder="Search..." sx={{ flexGrow: 1 }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </Box>
          </Stack>
        </Box>
        <Stack sx={{ width: '800px', height: '600px', overflow: 'auto' }} spacing={2}>
          {filterInventory.map(({ name, quantity }) => (
            <Box key={name} sx={{ width: '100%', minHeight: '150px', bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 5 }}>
              <Typography variant="h3" color="text.primary" sx={{ textAlign: 'left' }}>{name.charAt(0).toUpperCase() + name.slice(1)}</Typography>
              <Typography variant="h3" color="text.primary" sx={{ textAlign: 'center' }}>{quantity}</Typography>
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
    </Box>
  )
}
