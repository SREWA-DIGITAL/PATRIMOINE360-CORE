import { Button } from "../shared/button";

export const CategorySelectNoCategories = () => (
  <div>
    Vous n'avez pas encore de catégories.{" "}
    <Button to={"/categories/new"} variant="link" className="">
      Créez votre première catégorie
    </Button>
  </div>
);
