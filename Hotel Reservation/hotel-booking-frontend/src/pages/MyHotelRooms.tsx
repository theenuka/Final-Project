import { useQuery, useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import { useParams, Link } from "react-router-dom";
import { AiOutlinePlus } from "react-icons/ai";
import { RoomType } from "../../../shared/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import AddRoomTypeForm from "../forms/AddRoomTypeForm";
import EditRoomTypeForm from "../forms/EditRoomTypeForm";
import React, { useState } from "react";
import useAppContext from "../hooks/useAppContext";

const MyHotelRooms = () => {
  const { hotelId } = useParams();
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | undefined>(
    undefined
  );

  const { data: roomTypes, isLoading } = useQuery(
    ["fetchRoomTypes", hotelId],
    () => apiClient.getRoomTypes(hotelId || ""),
    {
      enabled: !!hotelId,
    }
  );

  const { mutate: deleteMutate, isLoading: isDeleting } = useMutation(
    (roomTypeId: string) => apiClient.deleteRoomType(hotelId || "", roomTypeId),
    {
      onSuccess: () => {
        showToast({ title: "Room Type Deleted!", type: "SUCCESS" });
        queryClient.invalidateQueries(["fetchRoomTypes", hotelId]);
      },
      onError: () => {
        showToast({ title: "Error Deleting Room Type", type: "ERROR" });
      },
    }
  );

  const handleDelete = (roomTypeId: string) => {
    deleteMutate(roomTypeId);
  };

  const handleEditClick = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return <span>Loading...</span>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">My Hotel Rooms</h1>
      <span className="flex justify-between">
        <h2 className="text-2xl font-bold mb-4">Room Types</h2>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center text-white bg-blue-600 font-bold text-xl p-2 rounded-md hover:bg-blue-500">
              <AiOutlinePlus />
              Add Room Type
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Room Type</DialogTitle>
              <DialogDescription>
                Add a new room type to your hotel.
              </DialogDescription>
            </DialogHeader>
            <AddRoomTypeForm
              hotelId={hotelId || ""}
              onSave={() => setIsAddModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </span>
      <div className="grid grid-cols-1 gap-8 mt-4">
        {roomTypes?.map((roomType: RoomType) => (
          <div key={roomType._id} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-xl font-bold">{roomType.name}</h3>
            <p className="text-gray-600">{roomType.description}</p>

// ... other imports

// ... inside the component
            <div className="flex justify-end">
              <React.Fragment>
                <Link
                  to={`/my-hotels/${hotelId}/room-types/${roomType._id}/rooms`}
                  className="text-white bg-green-600 font-bold text-xl p-2 rounded-md hover:bg-green-500 mr-2"
                >
                  Manage Rooms
                </Link>
              </React.Fragment>
              <button
                onClick={() => handleEditClick(roomType)}
                className="text-white bg-blue-600 font-bold text-xl p-2 rounded-md hover:bg-blue-500 mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(roomType._id)}
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
            <DialogTitle>Edit Room Type</DialogTitle>
            <DialogDescription>
              Edit the details of your room type.
            </DialogDescription>
          </DialogHeader>
          {selectedRoomType && (
            <EditRoomTypeForm
              hotelId={hotelId || ""}
              roomType={selectedRoomType}
              onSave={() => setIsEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyHotelRooms;

