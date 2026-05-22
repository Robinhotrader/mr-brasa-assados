import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

// 🔧 Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAmByQu1SMMOabUJL3nrRh6piV-IykIRqw",
  authDomain: "envi-1b323.firebaseapp.com",
  projectId: "envi-1b323",
  storageBucket: "envi-1b323.firebasestorage.app",
  messagingSenderId: "358397293574",
  appId: "1:358397293574:web:fcafef061352ac191a3f87"
};

// 🚀 Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Tipagem para retorno padrão
interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// ✅ Modelo atualizado para múltiplos produtos
export interface Pedido {
  id?: string;
  nome: string;
  telefone: string;
  produtos: string[];
  observacao?: string;
  entregue?: boolean;
  status?: string;
  clienteId?: string;
  clienteEmail?: string;
  createdAt?: any;
}

// 🔐 Autenticação normal
export const login = async (email: string, senha: string): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const register = async (email: string, senha: string): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logout = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = (): User | null => auth.currentUser;

export const onAuthStateChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

// 🔓 Login convidado (sem cadastro) usando usuário fixo
export const loginAnonimo = async (): Promise<AuthResult> => {
  try {
    // 🔹 Faz login com usuário convidado padrão
    const userCredential = await signInWithEmailAndPassword(auth, "convidado@mrbrasa.com", "123456");

    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 🍗 Firestore — Pedidos
export const tiposProdutos: string[] = [
  'Frango sem recheio',
  'Frango com recheio',
  'Costela bovina',
  'Costela suína',
  'Medalhão',
  'Linguiça artesanal',
  'Picanha',
  'Outro'
];

// ✅ Criar pedido
export const criarPedido = async (pedido: Pedido): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const novoPedido: Pedido = {
      ...pedido,
      clienteId: user.uid,
      clienteEmail: user.email ?? 'convidado',
      createdAt: serverTimestamp(),
      entregue: false,
      status: 'pendente',
    };

    const docRef = await addDoc(collection(db, 'pedidos'), novoPedido);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 🔎 Buscar pedidos
export const buscarPedidos = async (): Promise<{ success: boolean; pedidos?: Pedido[]; error?: string }> => {
  try {
    const q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const pedidos: Pedido[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Pedido[];
    return { success: true, pedidos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 🔔 Ouvir pedidos em tempo real
export const ouvirPedidos = (callback: (pedidos: Pedido[]) => void) => {
  const q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const pedidos: Pedido[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Pedido[];
    callback(pedidos);
  });
};

// ✅ Atualizar status
export const atualizarPedidoEntregue = async (
  pedidoId: string,
  entregue: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    await updateDoc(pedidoRef, {
      entregue,
      status: entregue ? 'entregue' : 'pendente'
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 🧹 Limpar pedidos entregues
export const limparPedidosEntregues = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const q = query(collection(db, 'pedidos'));
    const snapshot = await getDocs(q);

    const promises = snapshot.docs
      .filter((doc) => doc.data().entregue === true)
      .map((doc) => deleteDoc(doc.ref));

    await Promise.all(promises);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export default { app, auth, db };
