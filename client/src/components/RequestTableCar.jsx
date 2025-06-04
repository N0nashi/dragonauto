import React from "react";

const RequestTableCar = ({ applications, onView, onReply }) => {
  const carApps = applications.filter(app => app.type === "car");

  if (!carApps.length) {
    return <p className="text-gray-600">Нет заявок на автомобили.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">№ Заявки</th>
            <th className="px-4 py-2 text-left">Имя</th>
            <th className="px-4 py-2 text-left">Фамилия</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Действие</th>
          </tr>
        </thead>
        <tbody>
          {carApps.map((app) => (
            <tr key={app.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{app.id}</td>
              <td className="px-4 py-2">{app.first_name || "—"}</td>
              <td className="px-4 py-2">{app.last_name || "—"}</td>
              <td className="px-4 py-2">{app.email || "—"}</td>
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

export default RequestTableCar;
