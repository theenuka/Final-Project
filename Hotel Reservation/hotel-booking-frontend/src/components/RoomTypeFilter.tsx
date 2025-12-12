import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import { RoomType } from "../../../shared/types";

type Props = {
  selectedRoomTypes: string[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const RoomTypeFilter = ({ selectedRoomTypes, onChange }: Props) => {
  const { data: roomTypes, isLoading } = useQuery(
    "fetchRoomTypes",
    apiClient.getAllRoomTypes
  );

  if (isLoading) {
    return <span>Loading...</span>;
  }

  return (
    <div className="border-b border-slate-300 pb-5">
      <h4 className="text-md font-semibold mb-2">Room Type</h4>
      {roomTypes?.map((roomType: RoomType) => (
        <label key={roomType._id} className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="rounded"
            value={roomType._id}
            checked={selectedRoomTypes.includes(roomType._id)}
            onChange={onChange}
          />
          <span>{roomType.name}</span>
        </label>
      ))}
    </div>
  );
};

export default RoomTypeFilter;
