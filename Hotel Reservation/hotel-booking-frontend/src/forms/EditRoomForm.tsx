import { useForm } from "react-hook-form";
import { Room } from "../../../shared/types";
import { useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useEffect } from "react";

type Props = {
  hotelId: string;
  room: Room;
  onSave: () => void;
};

export type RoomFormData = {
  roomNumber: string;
  isAvailable: boolean;
};

const EditRoomForm = ({ hotelId, room, onSave }: Props) => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomFormData>();

  useEffect(() => {
    reset(room);
  }, [room, reset]);

  const { mutate, isLoading } = useMutation(
    (roomData: { roomNumber: string; isAvailable: boolean }) =>
      apiClient.updateRoom(hotelId, room._id, roomData),
    {
      onSuccess: () => {
        showToast({ title: "Room Updated!", type: "SUCCESS" });
        queryClient.invalidateQueries(["fetchRooms", hotelId, room.roomTypeId]);
        onSave();
      },
      onError: () => {
        showToast({ title: "Error Saving Room", type: "ERROR" });
      },
    }
  );

  const onSubmit = handleSubmit((formData: RoomFormData) => {
    mutate(formData);
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="text-gray-700 text-sm font-bold">
        Room Number
        <input
          type="text"
          className="border rounded w-full py-1 px-2 font-normal"
          {...register("roomNumber", { required: "This field is required" })}
        ></input>
        {errors.roomNumber && (
          <span className="text-red-500">{errors.roomNumber.message}</span>
        )}
      </label>
      <label className="text-gray-700 text-sm font-bold flex items-center gap-2">
        <input
          type="checkbox"
          {...register("isAvailable")}
        />
        Is Available
      </label>
      <span className="flex justify-end">
        <button
          disabled={isLoading}
          type="submit"
          className="bg-blue-600 text-white p-2 font-bold hover:bg-blue-500 text-xl disabled:bg-gray-500"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </span>
    </form>
  );
};

export default EditRoomForm;
