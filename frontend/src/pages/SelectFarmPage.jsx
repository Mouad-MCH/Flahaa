import { useAuthStore } from "../store/authStore";
import { useSelectFarmPage } from '../hooks/useSelectFarmPage.js'
import FarmCart from "../components/ui/FarmCart.jsx";
import { Button } from "../components/ui/ui.jsx";
import { PlusIcon } from "lucide-react";

const SelectFarmPage = () => {
  const user = useAuthStore((state) => state.user);

  const {farms, isLoading, isError, selectFarm} = useSelectFarmPage()
  

  return (
    <div className="w-full">
      <div className="w-full max-md:h-50 relative">
        <div className="absolute p-20 max-md:p-5 left-0 top-0 w-full h-full bg-linear-to-r from-white to-transparent">
          <div> 
            <div className="w-20 h-1 mb-3 bg-field rounded-full"></div>
            <h1 className="text-2xl font-bold ">Hello {user.name} </h1>
            <h1 className="text-2xl font-medium">Chose one farm to continue</h1>

          </div>
        </div>
        <img src="/images/flahaa-farm-image.png" className="w-full h-full max-md:object-center" alt="" />
      </div>

      <div className="p-5 flex items-center justify-between">
        <div className="w-30 h-6 p-2 flex items-center gap-3  rounded-full bg-green-500/20">
          <span className="w-2 h-2 rounded-full animate-ping transition-animate duration-300 bg-green-600"></span>
          <h3 className="font-medium">{farms.length} farms</h3>
        </div>

        <Button className="w-30 px-1 h-10 cursor-pointer flex items-center gap-2">
          <PlusIcon/>
          <h2>Add Farm</h2>
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-4 max-md:grid-cols-2 max-sm:grid-cols-1 p-5">
        {
          farms.map((farm) => (
            <FarmCart farm={farm} selectFarm={selectFarm} />
          ))
        }
      </div>
    </div>
  );
};

export default SelectFarmPage;
