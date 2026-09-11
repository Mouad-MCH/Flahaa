import { useAuthStore } from '../store/authStore'
import { useSelectFarmPage } from '../hooks/useSelectFarmPage';
import { useFarmStore } from '../store/farmStore';

const DashboardPage = () => {
    const logout = useAuthStore(state => state.logout);
    const user = useAuthStore(state => state.user);
    const {activeFarmId, clearActiveFarm} = useFarmStore()
    const { farms } = useSelectFarmPage()
    
    
    const FarmFilter = farms.filter((f) => f._id === activeFarmId);

  return (
    <div className='flex items-center justify-around mt-10'>
      <h1 className='flex items-center gap-3'>
        <div className='bg-green-400 w-10 h-10 rounded-full flex justify-center items-center font-bold text-olive-ink'>
          {user.name.slice(0,2)}
        </div>
        <p className='text-xl font-bold'> {user.name} 
          <br/>
          <span className='text-sm font-normal'>{FarmFilter[0]?.name}</span>
        </p>
      </h1>
      <div className='flex flex-col gap-2'>
      <button
        onClick={() => logout()}
        className='text-white bg-red-600 rounded-md px-3 py-2 cursor-pointer hover:bg-red-400'
      >
        Logout
      </button>

            <button
        onClick={() => clearActiveFarm()}
        className='text-white bg-green-300 rounded-md px-3 py-2 cursor-pointer hover:bg-red-400'
      >
        Logout from farm
      </button>

      </div>

    </div>
  )
}

export default DashboardPage
