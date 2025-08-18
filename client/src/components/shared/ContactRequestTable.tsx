import React from "react";

interface Contact {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  userId?: string | null;
  status?: "completed" | "on-going" | "marked-for-deletion" | "pending";
}

interface Props {
  contact: Contact;
  onCopyEmail: (email: string) => void;
  onStatusChange: (id: string, status: Contact["status"]) => void;
  onDelete: (id: string) => void;
  onGoToProfile: (userId: string | null | undefined) => void;
}

const ContactRequestTable: React.FC<Props> = ({
  contact,
  onCopyEmail,
  onStatusChange,
  onDelete,
  onGoToProfile,
}) => {
  return (
    <div className="rounded-xl shadow-lg border border-gray-800 bg-gray-900 p-0 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          <tr className="bg-gray-800">
            <td className="p-4 font-bold text-lg text-blue-400 w-1/2">
              {contact.userId ? (
                <button
                  className="hover:underline focus:outline-none"
                  onClick={() => onGoToProfile(contact.userId)}
                >
                  {contact.name}
                </button>
              ) : (
                <span>
                  {contact.name}{" "}
                  <span className="text-xs text-gray-400">
                    (not a signed up user)
                  </span>
                </span>
              )}
            </td>
            <td className="p-4 w-1/2 text-right">
              <select
                value={contact.status ?? "pending"}
                //value={contact.status || "pending"}
                onChange={(e) =>
                  onStatusChange(
                    contact._id,
                    e.target.value as Contact["status"]
                  )
                }
                className="border rounded px-2 py-1 bg-gray-900 text-blue-300 border-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="on-going">On-Going</option>
                <option value="marked-for-deletion">Mark for Deletion</option>
              </select>
            </td>
          </tr>
          <tr>
            <td className="p-4 text-gray-300" colSpan={2}>
              <span className="font-semibold">Email: </span>
              <button
                className="text-blue-400 underline hover:text-blue-300 ml-1"
                onClick={() => onCopyEmail(contact.email)}
                title="Copy email"
              >
                {contact.email}
              </button>
            </td>
          </tr>
          <tr>
            <td className="p-4 text-gray-300" colSpan={2}>
              <span className="font-semibold">Message:</span>
              <pre className="whitespace-pre-wrap break-words mt-2 bg-gray-950 rounded-lg p-3 border border-gray-800 text-gray-200 font-sans shadow-inner">
                {contact.message}
              </pre>
            </td>
          </tr>
          <tr>
            <td className="p-4 text-xs text-gray-500" colSpan={2}>
              {new Date(contact.createdAt).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td className="p-4" colSpan={2}>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 w-full"
                onClick={() => onDelete(contact._id)}
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ContactRequestTable;
