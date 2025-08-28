export default function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const message = (error as { message?: string } | null)?.message || 'Something went wrong';
  return (
    <div className="w-full flex flex-col items-center justify-center py-10 text-sm text-red-600 dark:text-red-500 gap-2">
      <div>{message}</div>
      {retry && (
        <button onClick={retry} className="text-xs underline">Retry</button>
      )}
    </div>
  );
}


