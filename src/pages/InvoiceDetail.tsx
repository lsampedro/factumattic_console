import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Invoice } from '../types/invoice'; 
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { ArrowBack, Close as CloseIcon, Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [editedInvoice, setEditedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleDownload = () => {
    if (invoice?.file_id) {
      window.open(`https://factumattic.s3.eu-north-1.amazonaws.com/${invoice.file_id}`, '_blank');
    }
  };

  const handleEdit = () => {
    if (!invoice) return;
    setEditedInvoice({
      ...invoice,
      userId: invoice.userId // Explicitly preserve userId
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!id || !editedInvoice || !invoice) return;

    try {
      const docRef = doc(db, 'invoices', id);
      // Create update data maintaining the original structure
      const updateData: Record<string, any> = {
        amount: editedInvoice?.['Total a Pagar'] ?? '',
        companyName: editedInvoice?.['Nombre Empresa Emisora'] ?? '',
        invoiceNumber: editedInvoice?.['Número de Factura'] ?? '',
        date: invoice.date, // Preserve the original date
        userId: invoice.userId, // Preserve the original userId
        data: {
          'Cuota Retención': editedInvoice?.['Cuota Retención'] ?? '',
          'Detalles de Pago': editedInvoice?.['Detalles de Pago'] ?? '',
          'Dirección Empresa Emisora': editedInvoice?.['Dirección Empresa Emisora'] ?? '',
          'Dirección Empresa Receptora': editedInvoice?.['Dirección Empresa Receptora'] ?? '',
          'Fecha': editedInvoice?.Fecha ?? '',
          'Fecha de Vencimiento': editedInvoice?.['Fecha de Vencimiento'] ?? '',
          'IVA': editedInvoice?.IVA ?? [],
          'Items': editedInvoice?.Items ?? [],
          'Importe Total Antes de Impuestos': editedInvoice?.['Importe Total Antes de Impuestos'] ?? '',
          'Importe Total de Impuestos': editedInvoice?.['Importe Total de Impuestos'] ?? '',
          'Método de Pago': editedInvoice?.['Método de Pago'] ?? '',
          'NIF Empresa Emisora': editedInvoice?.['NIF Empresa Emisora'] ?? '',
          'NIF Empresa Receptora': editedInvoice?.['NIF Empresa Receptora'] ?? '',
          'Nombre Empresa Emisora': editedInvoice?.['Nombre Empresa Emisora'] ?? '',
          'Nombre Empresa Receptora': editedInvoice?.['Nombre Empresa Receptora'] ?? '',
          'Número de Factura': editedInvoice?.['Número de Factura'] ?? '',
          'Tipo de Retención': editedInvoice?.['Tipo de Retención'] ?? '',
          'Total a Pagar': editedInvoice?.['Total a Pagar'] ?? '',
          file_id: editedInvoice?.file_id ?? ''
        }
      };

      await updateDoc(docRef, updateData);
      
      // Update the local state with the edited data
      setInvoice(editedInvoice);

      setIsEditing(false);
      setSnackbar({
        open: true,
        message: 'Cambios guardados correctamente',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating invoice:', err);
      setSnackbar({
        open: true,
        message: 'Error al guardar los cambios',
        severity: 'error'
      });
    }
  };

  const handleCancel = () => {
    setEditedInvoice(invoice);
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof Invoice, value: string) => {
    if (!editedInvoice || !invoice) return;
    
    setEditedInvoice({
      ...editedInvoice,
      [field]: value,
      userId: invoice.userId // Explicitly preserve userId
    });
  };

  useEffect(() => {
    async function fetchInvoice() {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'invoices', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const rawData = docSnap.data();
          // Si los datos están anidados en una propiedad 'data', usamos esos, sino usamos los datos directamente
          const data = rawData?.data || rawData;

          const transformedData: Invoice = {
            id: docSnap.id,
            ...data,
            userId: rawData?.userId ?? '',
            date: rawData?.date ?? new Date().toISOString()
          };
          
          setInvoice(transformedData);
          setEditedInvoice(transformedData);
        } else {
          setError('Factura no encontrada');
        }
      } catch (err) {
        setError('Error al cargar la factura');
        console.error('Error fetching invoice:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error || 'No se encontró la factura'}</Typography>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
            Volver al Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ height: '100vh', overflow: 'auto', bgcolor: '#f5f5f5' }}>
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')}>
            Volver
          </Button>
          <Box>
            {isEditing ? (
              <>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  sx={{ mr: 2 }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Guardar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ mr: 2 }}
                >
                  Editar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleOpenModal}
                >
                  Ver Documento
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          maxWidth="lg"
          PaperProps={{
            sx: { 
              width: '60%',
              height: '90vh',
              maxWidth: '900px'
            }
          }}
        >
          <DialogContent sx={{ position: 'relative', height: '100%', p: 0 }}>
            <Box sx={{
              position: 'absolute', 
              right: 8, 
              top: 8,
              zIndex: 1,
              bgcolor: 'background.paper',
              borderRadius: 1
            }}>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ 
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
              overflow: 'hidden'
            }}>
              <iframe
                src={`https://factumattic.s3.eu-north-1.amazonaws.com/${invoice?.file_id}`}
                style={{
                  width: '95%',
                  height: '100%',
                  border: 'none',
                  objectFit: 'contain',
                  maxWidth: '100%'
                }}
                title="Documento de factura"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Cerrar</Button>
            <Button onClick={handleDownload} variant="contained" color="primary">
              Descargar
            </Button>
          </DialogActions>
        </Dialog>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>Información General</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Número de Factura</Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editedInvoice?.['Número de Factura'] ?? ''}
                  onChange={(e) => handleFieldChange('Número de Factura', e.target.value)}
                  size="small"
                  margin="dense"
                />
              ) : (
                <Typography variant="body1" gutterBottom>{invoice?.['Número de Factura'] ?? ''}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Fecha</Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editedInvoice?.Fecha ?? ''}
                  onChange={(e) => handleFieldChange('Fecha', e.target.value)}
                  size="small"
                  margin="dense"
                />
              ) : (
                <Typography variant="body1" gutterBottom>{invoice?.Fecha ?? ''}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Fecha de Vencimiento</Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editedInvoice?.['Fecha de Vencimiento'] ?? ''}
                  onChange={(e) => handleFieldChange('Fecha de Vencimiento', e.target.value)}
                  size="small"
                  margin="dense"
                />
              ) : (
                <Typography variant="body1" gutterBottom>{invoice?.['Fecha de Vencimiento'] ?? ''}</Typography>
              )}
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>Datos de Emisor y Receptor</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Emisor</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Empresa</Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={editedInvoice?.['Nombre Empresa Emisora'] ?? ''}
                    onChange={(e) => handleFieldChange('Nombre Empresa Emisora', e.target.value)}
                    size="small"
                    margin="dense"
                  />
                ) : (
                  <Typography variant="body1">{invoice?.['Nombre Empresa Emisora'] ?? ''}</Typography>
                )}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">NIF</Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={editedInvoice?.['NIF Empresa Emisora'] ?? ''}
                    onChange={(e) => handleFieldChange('NIF Empresa Emisora', e.target.value)}
                    size="small"
                    margin="dense"
                  />
                ) : (
                  <Typography variant="body1">{invoice?.['NIF Empresa Emisora'] ?? ''}</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2">Dirección</Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={editedInvoice?.['Dirección Empresa Emisora'] ?? ''}
                    onChange={(e) => handleFieldChange('Dirección Empresa Emisora', e.target.value)}
                    size="small"
                    margin="dense"
                  />
                ) : (
                  <Typography variant="body1">{invoice?.['Dirección Empresa Emisora'] ?? ''}</Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Receptor</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Empresa/Nombre</Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={editedInvoice?.['Nombre Empresa Receptora'] ?? ''}
                    onChange={(e) => handleFieldChange('Nombre Empresa Receptora', e.target.value)}
                    size="small"
                    margin="dense"
                  />
                ) : (
                  <Typography variant="body1">{invoice?.['Nombre Empresa Receptora'] ?? ''}</Typography>
                )}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">NIF</Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={editedInvoice?.['NIF Empresa Receptora'] ?? ''}
                    onChange={(e) => handleFieldChange('NIF Empresa Receptora', e.target.value)}
                    size="small"
                    margin="dense"
                  />
                ) : (
                  <Typography variant="body1">{invoice?.['NIF Empresa Receptora'] ?? ''}</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2">Dirección</Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={editedInvoice?.['Dirección Empresa Receptora'] ?? ''}
                    onChange={(e) => handleFieldChange('Dirección Empresa Receptora', e.target.value)}
                    size="small"
                    margin="dense"
                  />
                ) : (
                  <Typography variant="body1">{invoice?.['Dirección Empresa Receptora'] ?? ''}</Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {invoice?.Items && invoice.Items.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>Lista de Items</Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  {invoice.Items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item?.Producto ?? ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {invoice?.IVA && invoice.IVA.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>Información de IVA</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Base Imponible</TableCell>
                    <TableCell align="right">Tipo de IVA</TableCell>
                    <TableCell align="right">Importe de IVA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(isEditing ? editedInvoice?.IVA : invoice?.IVA)?.map((iva, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={iva?.['Base imponible'] ?? ''}
                            onChange={(e) => {
                              if (!editedInvoice) return;
                              const newIVA = [...(editedInvoice.IVA ?? [])];
                              newIVA[index] = {
                                ...newIVA[index],
                                'Base imponible': e.target.value
                              };
                              setEditedInvoice({
                                ...editedInvoice,
                                IVA: newIVA
                              });
                            }}
                          />
                        ) : (
                          iva?.['Base imponible'] ?? ''
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={iva?.['Tipo de IVA'] ?? ''}
                            onChange={(e) => {
                              if (!editedInvoice) return;
                              const newIVA = [...(editedInvoice.IVA ?? [])];
                              newIVA[index] = {
                                ...newIVA[index],
                                'Tipo de IVA': e.target.value
                              };
                              setEditedInvoice({
                                ...editedInvoice,
                                IVA: newIVA
                              });
                            }}
                            sx={{ width: '100px' }}
                          />
                        ) : (
                          `${iva?.['Tipo de IVA'] ?? ''}%`
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={iva?.['Importe de IVA'] ?? ''}
                            onChange={(e) => {
                              if (!editedInvoice) return;
                              const newIVA = [...(editedInvoice.IVA ?? [])];
                              newIVA[index] = {
                                ...newIVA[index],
                                'Importe de IVA': e.target.value
                              };
                              setEditedInvoice({
                                ...editedInvoice,
                                IVA: newIVA
                              });
                            }}
                            sx={{ width: '120px' }}
                          />
                        ) : (
                          iva?.['Importe de IVA'] ?? ''
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Datos de Pago</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Método de Pago</Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={editedInvoice?.['Método de Pago'] ?? ''}
                    onChange={(e) => handleFieldChange('Método de Pago', e.target.value)}
                    size="small"
                    margin="dense"
                  />
                ) : (
                  <Typography variant="body1" gutterBottom>{invoice?.['Método de Pago'] ?? ''}</Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Detalles de Pago</Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={editedInvoice?.['Detalles de Pago'] ?? ''}
                    onChange={(e) => handleFieldChange('Detalles de Pago', e.target.value)}
                    size="small"
                    margin="dense"
                  />
                ) : (
                  <Typography variant="body1" gutterBottom>{invoice?.['Detalles de Pago'] ?? ''}</Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="subtitle1">Total a Pagar</Typography>
                {isEditing ? (
                  <TextField
                    value={editedInvoice?.['Total a Pagar'] ?? ''}
                    onChange={(e) => handleFieldChange('Total a Pagar', e.target.value)}
                    size="small"
                    sx={{ width: '150px' }}
                    InputProps={{
                      endAdornment: <Typography>€</Typography>
                    }}
                  />
                ) : (
                  <Typography variant="h6">{invoice?.['Total a Pagar'] ?? ''} €</Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default InvoiceDetail;