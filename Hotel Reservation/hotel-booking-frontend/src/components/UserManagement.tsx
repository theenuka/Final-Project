import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import { UserType } from "../../../shared/types";

const UserManagement = () => {
  const { data: users, isLoading } = useQuery(
    "fetchUsers",
    apiClient.fetchAllUsers
  );

  if (isLoading) {
    return <span>Loading...</span>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">First Name</th>
            <th className="py-2">Last Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user: UserType) => (
            <tr key={user._id}>
              <td className="border px-4 py-2">{user.firstName}</td>
              <td className="border px-4 py-2">{user.lastName}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.role}</td>
              <td className="border px-4 py-2">
                <button className="text-white bg-blue-600 font-bold text-xl p-2 rounded-md hover:bg-blue-500 mr-2">
                  Edit
                </button>
                <button className="text-white bg-red-600 font-bold text-xl p-2 rounded-md hover:bg-red-500">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
