import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/useSocket";
import { FaDoorOpen, FaUserAstronaut, FaRocket, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGameStore } from "@/context/gameStore";
function Home() {
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [view, setView] = useState<'menu' | 'create' | 'join'>('menu');
    const { joinRoom } = useGameStore()
    const [formData, setFormData] = useState({
        roomName: '',
        playerName: '',
        roomCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        setError('');
    };

    const validateForm = (type: 'create' | 'join') => {
        if (!formData.playerName.trim()) {
            setError('Por favor, insira seu nome');
            return false;
        }
        if (type === 'create' && !formData.roomName.trim()) {
            setError('Por favor, insira um nome para a sala');
            return false;
        }
        if (type === 'join' && !formData.roomCode.trim()) {
            setError('Por favor, insira o código da sala');
            return false;
        }
        return true;
    };

    const handleCreateRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm('create')) return;

        setLoading(true);
        socket.emit('create', {
            roomName: formData.roomName,
            playerName: formData.playerName
        });
    };

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm('join')) return;

        setLoading(true);
        socket.emit('join', {
            roomCode: formData.roomCode,
            playerName: formData.playerName
        });
    };

    useEffect(() => {
        const handleCreated = (response: { room: any, player: any, role: string }) => {
            const { room, player, role } = response
            joinRoom(room, player, null, role)
            setLoading(false);
            navigate(`/room/${room.id}`);
        };

        const handleError = (error: { message: string }) => {
            setLoading(false);
            setError(error.message);
        };

        const handleJoin = (response: { room: any, player: any, opponent: any, role: string }) => {
            const { room, player, opponent, role } = response
            joinRoom(room, player, opponent, role)
            setLoading(false)
            navigate(`/room/${room.id}`);

        }

        socket.on('created', handleCreated);
        socket.on('joined', handleJoin)
        socket.on('join-error', handleError);
        socket.on('create-error', handleError);

        return () => {
            socket.off('created', handleCreated);
            socket.off('joined', handleJoin)
            socket.off('join-error', handleError);
            socket.off('create-error', handleError);
        };
    }, [socket, navigate]);

    const renderForm = () => {
        switch (view) {
            case 'create':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <button
                            onClick={() => setView('menu')}
                            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
                        >
                            <FaArrowLeft />
                            Voltar
                        </button>

                        <form onSubmit={handleCreateRoom} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="roomName" className="flex items-center gap-2">
                                        <FaDoorOpen className="text-cyan-400" />
                                        Nome da Sala
                                    </Label>
                                    <Input
                                        id="roomName"
                                        value={formData.roomName}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Frota do Atlântico"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="playerName" className="flex items-center gap-2">
                                        <FaUserAstronaut className="text-cyan-400" />
                                        Seu Nome
                                    </Label>
                                    <Input
                                        id="playerName"
                                        value={formData.playerName}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Capitão Nascimento"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-sm">{error}</p>}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 text-lg"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Criando...</span>
                                ) : (
                                    <>
                                        <FaRocket className="mr-2" />
                                        Criar Batalha
                                    </>
                                )}
                            </Button>
                        </form>
                    </motion.div>
                );

            case 'join':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <button
                            onClick={() => setView('menu')}
                            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
                        >
                            <FaArrowLeft />
                            Voltar
                        </button>

                        <form onSubmit={handleJoinRoom} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="roomCode" className="flex items-center gap-2">
                                        <FaDoorOpen className="text-cyan-400" />
                                        Código da Sala
                                    </Label>
                                    <Input
                                        id="roomCode"
                                        value={formData.roomCode}
                                        onChange={handleInputChange}
                                        placeholder="Insira o código da sala"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="playerName" className="flex items-center gap-2">
                                        <FaUserAstronaut className="text-cyan-400" />
                                        Seu Nome
                                    </Label>
                                    <Input
                                        id="playerName"
                                        value={formData.playerName}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Capitão Nascimento"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-sm">{error}</p>}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 text-lg"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Entrando...</span>
                                ) : (
                                    <>
                                        <FaSignInAlt className="mr-2" />
                                        Entrar na Batalha
                                    </>
                                )}
                            </Button>
                        </form>
                    </motion.div>
                );

            default:
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <Button
                            onClick={() => setView('create')}
                            className="w-full py-6 text-lg bg-cyan-600 hover:bg-cyan-700"
                        >
                            <FaRocket className="mr-2" />
                            Nova Batalha
                        </Button>

                        <Button
                            onClick={() => setView('join')}
                            className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
                        >
                            <FaSignInAlt className="mr-2" />
                            Entrar em Batalha
                        </Button>
                    </motion.div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-navy-800 to-blue-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg shadow-2xl rounded-2xl p-8 w-full max-w-md space-y-8 border border-white/20">
                <div className="text-center space-y-4">
                    <motion.h1
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
                    >
                        BATALHA NAVAL
                    </motion.h1>
                    <p className="text-gray-300 text-sm">
                        {view === 'menu' ? 'Escolha seu comando:' : 'Preencha os dados da batalha'}
                    </p>
                </div>

                {renderForm()}

                <p className="text-center text-gray-400 text-sm">
                    {view === 'menu' && 'Convoque sua frota e domine os mares!'}
                    {view === 'create' && 'Compartilhe o nome da sala com seus aliados!'}
                    {view === 'join' && 'Insira o código fornecido pelo comandante!'}
                </p>
            </div>
        </div>
    );
}

export default Home;