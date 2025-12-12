import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import { UserType } from "../../../shared/types";

const AdminDashboard = () => {
  const { data: users, isLoading } = useQuery(
    "fetchAllUsers",
    apiClient.fetchAllUsers
  );

  if (isLoading) {
    return <span>Loading Users...</span>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <h2 className="text-2xl font-semibold mb-2">All Users</h2>
      <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user: UserType) => (
              <tr key={user._id} className="border-b hover:bg-gray-100">
                <td className="p-2">{`${user.firstName} ${user.lastName}`}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.role}</td>
                <td className="p-2">{new Date(user.createdAt || "").toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
