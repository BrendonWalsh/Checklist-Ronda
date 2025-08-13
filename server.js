// 1. Importar TODOS os pacotes necessários
const express = require('express');
const mongoose = require('mongoose'); // GARANTIR QUE ESTA LINHA ESTEJA AQUI
const cors = require('cors');
const bcrypt = require('bcryptjs');

// 2. Inicializar o servidor Express
const app = express();
const PORT = 3000;

// 3. Configurar os "Middlewares"
app.use(cors());
// Aumentar o limite do corpo da requisição para aceitar imagens grandes em Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// 4. Conectar ao banco de dados MongoDB
mongoose.connect('mongodb://localhost:27017/seculus-ronda')
  .then(() => console.log('Conectado ao MongoDB com sucesso!'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// --- LÓGICA DE USUÁRIOS (sem alterações) ---
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


// --- LÓGICA DO CHECKLIST (ATUALIZADA) ---
const checklistSchema = new mongoose.Schema({
  dataChecagem: { type: Date, required: true },
  horaChecagem: { type: String, required: true },
  seguranca: { type: String, required: true },
  colaboradorAbordado: { type: String, required: true },
  setorOrigem: { type: String, required: true },
  setorDestino: { type: String, required: true },
  produtos: [{ tipo: String, quantidade: Number }],
  validacaoDocumento: { type: String, enum: ['com_doc', 'sem_doc'], required: true },
  numeroDocumento: String,
  descricaoProdutos: String,
  checklistConformidade: { 
    cracha: String,
    observacaoCracha: String,
    evidenciaCracha: String, // Para guardar a imagem Base64

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
    const novoChecklist = new Checklist(req.body);
    await novoChecklist.save();
    res.status(201).json({ message: 'Checklist salvo com sucesso!', data: novoChecklist });
  } catch (error) {
    console.error("Erro ao salvar o checklist:", error);
    res.status(400).json({ message: 'Erro ao salvar o checklist.', error: error.message });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});
