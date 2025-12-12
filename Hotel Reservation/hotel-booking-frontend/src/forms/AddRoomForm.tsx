import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";

type Props = {
  hotelId: string;
  roomTypeId: string;
  onSave: () => void;
};

export type RoomFormData = {
  roomNumber: string;
};

const AddRoomForm = ({ hotelId, roomTypeId, onSave }: Props) => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormData>();

  const { mutate, isLoading } = useMutation(
    (roomData: { roomNumber: string }) =>
      apiClient.createRoom(hotelId, { ...roomData, roomTypeId }),
    {
      onSuccess: () => {
        showToast({ title: "Room Saved!", type: "SUCCESS" });
        queryClient.invalidateQueries(["fetchRooms", hotelId, roomTypeId]);
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

export default AddRoomForm;
