import { useQuery, useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import { useParams } from "react-router-dom";
import { AiOutlinePlus } from "react-icons/ai";
import { Room } from "../../../shared/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import AddRoomForm from "../forms/AddRoomForm";
import EditRoomForm from "../forms/EditRoomForm";
import { useState } from "react";
import useAppContext from "../hooks/useAppContext";

const MyHotelRoomInstances = () => {
  const { hotelId, roomTypeId } = useParams();
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>(undefined);

  const { data: rooms, isLoading } = useQuery(
    ["fetchRooms", hotelId, roomTypeId],
    () => apiClient.getRooms(hotelId || "", roomTypeId || ""),
    {
      enabled: !!hotelId && !!roomTypeId,
    }
  );

  const { mutate: deleteMutate, isLoading: isDeleting } = useMutation(
    (roomId: string) => apiClient.deleteRoom(hotelId || "", roomId),
    {
      onSuccess: () => {
        showToast({ title: "Room Deleted!", type: "SUCCESS" });
        queryClient.invalidateQueries(["fetchRooms", hotelId, roomTypeId]);
      },
      onError: () => {
        showToast({ title: "Error Deleting Room", type: "ERROR" });
      },
    }
  );

  const handleDelete = (roomId: string) => {
    deleteMutate(roomId);
  };

  const handleEditClick = (room: Room) => {
    setSelectedRoom(room);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return <span>Loading...</span>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Manage Rooms</h1>
      <span className="flex justify-between">
        <h2 className="text-2xl font-bold mb-4">Rooms</h2>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center text-white bg-blue-600 font-bold text-xl p-2 rounded-md hover:bg-blue-500">
              <AiOutlinePlus />
              Add Room
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Room</DialogTitle>
              <DialogDescription>
                Add a new room to this room type.
              </DialogDescription>
            </DialogHeader>
            <AddRoomForm
              hotelId={hotelId || ""}
              roomTypeId={roomTypeId || ""}
              onSave={() => setIsAddModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </span>
      <div className="grid grid-cols-1 gap-8 mt-4">
        {rooms?.map((room: Room) => (
          <div key={room._id} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-xl font-bold">{room.roomNumber}</h3>
            <p className="text-gray-600">
              {room.isAvailable ? "Available" : "Not Available"}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => handleEditClick(room)}
                className="text-white bg-blue-600 font-bold text-xl p-2 rounded-md hover:bg-blue-500 mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(room._id)}
                disabled={isDeleting}
                className="text-white bg-red-600 font-bold text-xl p-2 rounded-md hover:bg-red-500 disabled:bg-gray-500"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Edit the details of your room.
            </DialogDescription>
          </DialogHeader>
          {selectedRoom && (
            <EditRoomForm
              hotelId={hotelId || ""}
              room={selectedRoom}
              onSave={() => setIsEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyHotelRoomInstances;
