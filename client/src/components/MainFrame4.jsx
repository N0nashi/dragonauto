export default function MainFrame4() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-10">
        {/* Карта через iframe */}
        <div className="md:w-2/3 h-80 md:h-[400px] rounded-lg overflow-hidden shadow-lg">
          <iframe
            title="DragonAuto Office Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2282.602799664989!2d61.29221631578879!3d55.17203804810462!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x43e8d9b400000001%3A0x6a6f4e0bb687ba8c!2z0JrQvtGB0LrQuNC5INCX0LDQvdC-0YDQvtCy0LDRgNCw!5e0!3m2!1sru!2sru!4v1696223209448!5m2!1sru!2sru"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        {/* Контакты */}
        <div className="md:w-1/3 flex flex-col justify-center bg-white p-8 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold mb-6 text-[#00355B]">Контакты</h3>

          <p className="mb-4 text-gray-700">
            Адрес: Челябинск, Салавата Юлаева д.29
          </p>

          <a
            href="https://t.me/nonashi"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-block bg-[#0088cc] hover:bg-[#0077b6] text-white px-5 py-3 rounded-md transition"
          >
            Telegram
          </a>

          <p className="mb-2 text-gray-700">
            Телефон:{" "}
            <a href="tel:+74951234567" className="text-[#00355B] hover:underline">
              +7 (495) 123-45-67
            </a>
          </p>

          <p className="text-gray-700">
            Почта:{" "}
            <a
              href="mailto:info@dragonauto.ru"
              className="text-[#00355B] hover:underline"
            >
              info@dragonauto.ru
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
