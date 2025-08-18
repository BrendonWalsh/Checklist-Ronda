// 1. Importar TODOS os pacotes necessários
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// 2. Inicializar o servidor Express
const app = express();
const PORT = 3000;

// 3. Configurar os "Middlewares"
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. Conectar ao banco de dados MongoDB
mongoose.connect('mongodb://localhost:27017/seculus-ronda')
  .then(() => console.log('Conectado ao MongoDB com sucesso!'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// --- LÓGICA DE USUÁRIOS ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

app.post('/api/users/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Este nome de usuário já existe.' });
        }
        res.status(500).json({ message: 'Erro ao registrar usuário.', error: error.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha inválida.' });
        }
        res.status(200).json({ message: 'Login realizado com sucesso!', username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao fazer login.', error: error.message });
    }
});

// --- LÓGICA DO CONTADOR DE OCORRÊNCIAS ---
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    sequence_value: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

async function getNextSequenceValue(sequenceName) {
    const sequenceDocument = await Counter.findByIdAndUpdate(
        sequenceName,
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
    return sequenceDocument.sequence_value;
}

// --- LÓGICA DO CHECKLIST ---
const checklistSchema = new mongoose.Schema({
  occurrenceNumber: { type: Number, unique: true },
  dataChecagem: { type: Date, required: true },
  horaChecagem: { type: String, required: true },
  seguranca: { type: String, required: true },
  colaboradorAbordado: { type: String, required: true },
  setorOrigem: { type: String, required: true },
  setorDestino: { type: String, required: true },
  produtos: [{ tipo: String, quantidade: Number }],
  checklistConformidade: { 
    documentoTransporte: String,
    numeroDocumentoAnexo: String,
    evidenciaDocumentoAnexo: String,
    descricaoSemDocumento: String,
    cracha: String,
    observacaoCracha: String,
    evidenciaCracha: String,
    formulario: String,
    observacaoFormulario: String,
    evidenciaFormulario: String,
    material: String,
    observacaoMaterial: String,
    embalagem: String,
    observacaoEmbalagem: String,
    evidenciaEmbalagem: String,
  },
  numeroLacre: String,
  observacaoGeral: String,
  statusFinal: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Checklist = mongoose.model('Checklist', checklistSchema);

app.post('/api/checklists', async (req, res) => {
  try {
    const occurrenceNumber = await getNextSequenceValue('occurrenceId');
    const checklistData = { ...req.body, occurrenceNumber };
    
    const novoChecklist = new Checklist(checklistData);
    await novoChecklist.save();
    res.status(201).json({ message: 'Checklist salvo com sucesso!', data: novoChecklist });
  } catch (error) {
    console.error("Erro ao salvar o checklist:", error);
    res.status(400).json({ message: 'Erro ao salvar o checklist.', error: error.message });
  }
});

app.get('/api/checklists', async (req, res) => {
  try {
    const checklists = await Checklist.find().sort({ occurrenceNumber: -1 });
    res.status(200).json(checklists);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar histórico de checklists.' });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});
