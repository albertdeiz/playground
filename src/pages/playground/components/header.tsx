export const Header = ({ title }: { title: string }) => {
  return (
    <div
      className="flex justify-between items-center"
      style={{ backgroundColor: "#363848" }}
    >
      <div
        className="flex items-center h-10 pl-4 pr-6 gap-1 w-44"
        style={{ backgroundColor: "#44475a" }}
      >
        <div className="flex-shrink-0">
          <svg
            width="24px"
            height="24px"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            fill="#bdbdbd"
          >
            <path d="M10 5h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4v1h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4v1zM6 5V4H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4z" />
            <path
              fillRule="evenodd"
              d="M8 1a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-1 0v-13A.5.5 0 0 1 8 1z"
            />
          </svg>
        </div>
        <p className="text-sm text-white ml-2 font-light text-ellipsis w-full overflow-hidden text-nowrap">
          {title}
        </p>
      </div>
    </div>
  );
};
