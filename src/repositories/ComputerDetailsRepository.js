class ComputerDetailsRepository {
    constructor(Model) { this.Model = Model; }

    async findByComputerIds(ids) {
        return await this.Model.find({ computerId: { $in: ids } });
    }

    async create(computerId, specs) {
        return await this.Model.create({ computerId, specs });
    }
}