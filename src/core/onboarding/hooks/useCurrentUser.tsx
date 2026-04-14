import { useSelector } from 'react-redux';

const useCurrentUser = () => useSelector((state: any) => state.auth?.user);

export default useCurrentUser;