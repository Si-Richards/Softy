
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

export const getPresenceColor = (presence: string) => {
  switch (presence) {
    case "available":
      return "bg-softphone-success";
    case "busy":
      return "bg-softphone-error";
    case "away":
      return "bg-yellow-500";
    case "offline":
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
};
