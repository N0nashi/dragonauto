import React from "react";

const RequestTableAll = ({ applications, onView, onReply }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Имя</th>
            <th className="px-4 py-2 text-left">Фамилия</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Тип</th>
            <th className="px-4 py-2 text-left">Дата</th>
            <th className="px-4 py-2 text-left">Статус</th>
            <th className="px-4 py-2 text-left">Действие</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{app.id}</td>
              <td className="px-4 py-2">{app.first_name || "—"}</td>
              <td className="px-4 py-2">{app.last_name || "—"}</td>
              <td className="px-4 py-2">{app.email || "—"}</td>
              <td className="px-4 py-2">{app.type}</td>
              <td className="px-4 py-2">{new Date(app.date).toLocaleDateString()}</td>
              <td className="px-4 py-2">
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {app.status}
                </span>
              </td>
              <td className="px-4 py-2 space-x-2">
                <button
                  onClick={() => onView(app.id)}
                  className="text-blue-600 hover:underline"
                >
                  Посмотреть
                </button>
                {onReply && app.email && (
                  <button
                    onClick={() => onReply(app.email, app.id)}
                    className="text-green-600 hover:underline"
                  >
                    Ответить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RequestTableAll;
