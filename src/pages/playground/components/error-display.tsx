export const ErrorDisplay = ({ error }: { error: string }) => {
  return (
    <div className="flex sticky top-0 left-0 w-full h-full py-2 pl-0 pr-2 z-10">
      <div className="flex-1 bg-red-600 rounded-md p-2">
        <p className="text-white text-md">{error}</p>
      </div>
    </div>
  );
};
