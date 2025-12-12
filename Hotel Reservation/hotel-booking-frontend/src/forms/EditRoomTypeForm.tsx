import { useForm } from "react-hook-form";
import { RoomType } from "../../../shared/types";
import { useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { roomAmenities } from "../config/room-amenities-config";
import { useEffect } from "react";

type Props = {
  hotelId: string;
  roomType: RoomType;
  onSave: () => void;
};

export type RoomTypeFormData = {
  name: string;
  description: string;
  adultCount: number;
  childCount: number;
  pricePerNight: number;
  amenities: string[];
  imageFiles: FileList;
};

const EditRoomTypeForm = ({ hotelId, roomType, onSave }: Props) => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomTypeFormData>();

  useEffect(() => {
    reset(roomType);
  }, [roomType, reset]);

  const { mutate, isLoading } = useMutation(
    (roomTypeData: FormData) =>
      apiClient.updateRoomType(hotelId, roomType._id, roomTypeData),
    {
      onSuccess: () => {
        showToast({ title: "Room Type Updated!", type: "SUCCESS" });
        queryClient.invalidateQueries(["fetchRoomTypes", hotelId]);
        onSave();
      },
      onError: () => {
        showToast({ title: "Error Saving Room Type", type: "ERROR" });
      },
    }
  );

  const onSubmit = handleSubmit((formData: RoomTypeFormData) => {
    const formDataWithImages = new FormData();
    formDataWithImages.append("name", formData.name);
    formDataWithImages.append("description", formData.description);
    formDataWithImages.append("adultCount", formData.adultCount.toString());
    formDataWithImages.append("childCount", formData.childCount.toString());
    formDataWithImages.append("pricePerNight", formData.pricePerNight.toString());
    formData.amenities.forEach((amenity, index) => {
      formDataWithImages.append(`amenities[${index}]`, amenity);
    });
    Array.from(formData.imageFiles).forEach((imageFile) => {
      formDataWithImages.append(`imageFiles`, imageFile);
    });

    mutate(formDataWithImages);
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="text-gray-700 text-sm font-bold">
        Name
        <input
          type="text"
          className="border rounded w-full py-1 px-2 font-normal"
          {...register("name", { required: "This field is required" })}
        ></input>
        {errors.name && (
          <span className="text-red-500">{errors.name.message}</span>
        )}
      </label>
      <label className="text-gray-700 text-sm font-bold">
        Description
        <textarea
          rows={5}
          className="border rounded w-full py-1 px-2 font-normal"
          {...register("description", { required: "This field is required" })}
        ></textarea>
        {errors.description && (
          <span className="text-red-500">{errors.description.message}</span>
        )}
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="text-gray-700 text-sm font-bold">
          Adult Count
          <input
            type="number"
            min={1}
            className="border rounded w-full py-1 px-2 font-normal"
            {...register("adultCount", { required: "This field is required" })}
          ></input>
          {errors.adultCount && (
            <span className="text-red-500">{errors.adultCount.message}</span>
          )}
        </label>
        <label className="text-gray-700 text-sm font-bold">
          Child Count
          <input
            type="number"
            min={0}
            className="border rounded w-full py-1 px-2 font-normal"
            {...register("childCount", { required: "This field is required" })}
          ></input>
          {errors.childCount && (
            <span className="text-red-500">{errors.childCount.message}</span>
          )}
        </label>
      </div>
      <label className="text-gray-700 text-sm font-bold">
        Price Per Night
        <input
          type="number"
          min={1}
          className="border rounded w-full py-1 px-2 font-normal"
          {...register("pricePerNight", {
            required: "This field is required",
          })}
        ></input>
        {errors.pricePerNight && (
          <span className="text-red-500">
            {errors.pricePerNight.message}
          </span>
        )}
      </label>
      <div>
        <h2 className="text-2xl font-bold mb-3">Amenities</h2>
        <div className="grid grid-cols-5 gap-3">
          {roomAmenities.map((amenity) => (
            <label key={amenity} className="text-sm flex gap-1 text-gray-700">
              <input
                type="checkbox"
                value={amenity}
                {...register("amenities")}
              />
              {amenity}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-3">Images</h2>
        <input
          type="file"
          multiple
          accept="image/*"
          className="w-full text-gray-700 font-normal"
          {...register("imageFiles")}
        />
      </div>
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

export default EditRoomTypeForm;
