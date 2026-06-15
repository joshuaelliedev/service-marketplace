import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Category, CategoryDocument } from "./category.schema";

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    const exists = await this.categoryModel.exists({});
    if (exists) return;
    await this.categoryModel.create({ name: "General", isActive: true });
  }

  listPublic() {
    return this.categoryModel.find({ isActive: true }).sort({ name: 1 }).lean();
  }

  listAllAdmin() {
    return this.categoryModel.find().sort({ name: 1 }).lean();
  }

  countAll(): Promise<number> {
    return this.categoryModel.countDocuments();
  }

  async create(name: string) {
    return this.categoryModel.create({ name: name.trim(), isActive: true });
  }

  async update(id: string, patch: { name?: string; isActive?: boolean }) {
    const cat = await this.categoryModel.findById(id);
    if (!cat) throw new NotFoundException("Category not found");
    if (patch.name !== undefined) cat.name = patch.name.trim();
    if (patch.isActive !== undefined) cat.isActive = patch.isActive;
    await cat.save();
    return cat;
  }

  async remove(id: string) {
    const res = await this.categoryModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException("Category not found");
    return { ok: true };
  }

  async requireActiveCategoryId(id: string): Promise<void> {
    const exists = await this.categoryModel.exists({ _id: id, isActive: true });
    if (!exists) throw new BadRequestException("Invalid category");
  }
}
