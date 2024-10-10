import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/useSocket";
import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';


function Home() {
    const { socket } = useSocket()
    const navigate = useNavigate();
    const createRoom = () => {
        socket.emit('create')
    }

    useEffect(() => {
        const handleCreated = (response) => {
            navigate(`/room/${response.id}`);
        };

        socket.on('created', handleCreated);

        // Cleanup function to remove the listener when the component unmounts
        return () => {
            socket.off('created', handleCreated);
        };
    }, [socket, navigate]);

    return (
        <div className="h-auto w-full flex justify-center">
            <div className="h-96 flex flex-col justify-between items-center w-[350px] p-4 ">
                <div className="h-4">
                    <a className="text-center font-bold text-3xl">BATTLE SHIP GAME</a>
                </div>
                <div className="flex w-full h-28 ">
                    <Button onClick={createRoom} className="w-full">Criar Sala</Button>
                </div>
            </div>
        </div>
    )
}

export default Home