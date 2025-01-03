import { Command } from "commander";
import { list } from "../api";
import fs from "fs";

const lpRegex = /\bLP\b/;

export default (program: Command) => {
  program
    .command("organize")
    .description("(opinionated) Organize the collection")
    .action(async () => {
      /**
       * This command will organize the collection in an opinionated way.
       * First, it sort by into vinyl record sizes (12", 10", or 7").
       * Then, within each size,
       *    if the release is an LP, organize under the first Genre.
       *    if the release is not an LP, organize under the first Style.
       * Then within each Genre or Style, sort by Artist. And then by Title.
       */
      const organization = {} as any;

      //   const data = await list();
      const data = JSON.parse(fs.readFileSync("collection.json", "utf-8"));

      const sizeOrganization = categorizeBySize(data);

    //   data.forEach((release) => {
    //     const { basic_information } = release;
    //     const { formats } = basic_information;
    //     const { name, descriptions } = formats[0];

    //     if (name !== "Vinyl") {
    //       return;
    //     }

    //     if (!descriptions) {
    //       return;
    //     }

    //     const twelve = descriptions.some(twelveRegex.test.bind(twelveRegex));
    //     const ten = descriptions.some(tenRegex.test.bind(tenRegex));
    //     const seven = descriptions.some(sevenRegex.test.bind(sevenRegex));

    //     switch (true) {
    //       case twelve:
    //         if (!organization["12"]) {
    //           organization["12"] = [];
    //         }

    //         organization["12"].push(release);
    //         break;
    //       case ten:
    //         if (!organization["10"]) {
    //           organization["10"] = [];
    //         }

    //         organization["10"].push(release);
    //         break;
    //       case seven:
    //         if (!organization["7"]) {
    //           organization["7"] = [];
    //         }

    //         organization["7"].push(release);
    //         break;
    //       default:
    //         if (!organization["other"]) {
    //           organization["other"] = [];
    //         }

    //         organization["other"].push(release);
    //         break;
    //     }
    //   });

      Object.keys(organization).forEach((size) => {
        const releases = organization[size];

        releases.forEach((release) => {
          const { basic_information } = release;
          const { genres, styles } = basic_information;

          const genre = genres[0];
          const style = styles[0];

          if (genre) {
            if (!organization[genre]) {
              organization[genre] = [];
            }

            organization[genre].push(release);
          } else if (style) {
            if (!organization[style]) {
              organization[style] = [];
            }

            organization[style].push(release);
          } else {
            if (!organization["other"]) {
              organization["other"] = [];
            }

            organization["other"].push(release);
          }
        });
      });

      Object.keys(organization).forEach((key) => {
        const releases = organization[key];

        releases.sort((a, b) => {
          const artistA = a.basic_information.artists[0].name;
          const artistB = b.basic_information.artists[0].name;

          if (artistA < artistB) {
            return -1;
          }

          if (artistA > artistB) {
            return 1;
          }

          return 0;
        });
      });

      //   fs.writeFileSync("collection.json", JSON.stringify(data, null, 2));
      fs.writeFileSync(
        "organization.json",
        JSON.stringify(organization, null, 2),
      );
    });
};

function categorizeBySize(data: any) {
  const organization = {} as any;

  const twelveRegex = /\b12\b/;
  const tenRegex = /\b10\b/;
  const sevenRegex = /\b7\b/;

  data.forEach((release) => {
    const { basic_information } = release;
    const { formats } = basic_information;
    const { name, descriptions } = formats[0];

    if (name !== "Vinyl") {
      return;
    }

    if (!descriptions) {
      return;
    }

    const twelve = descriptions.some(twelveRegex.test.bind(twelveRegex));
    const ten = descriptions.some(tenRegex.test.bind(tenRegex));
    const seven = descriptions.some(sevenRegex.test.bind(sevenRegex));

    switch (true) {
      case twelve:
        if (!organization["12"]) {
          organization["12"] = [];
        }

        organization["12"].push(release);
        break;
      case ten:
        if (!organization["10"]) {
          organization["10"] = [];
        }

        organization["10"].push(release);
        break;
      case seven:
        if (!organization["7"]) {
          organization["7"] = [];
        }

        organization["7"].push(release);
        break;
      default:
        if (!organization["other"]) {
          organization["other"] = [];
        }

        organization["other"].push(release);
        break;
    }
  });

  console.log(
    Object.entries(organization)
      .map(([size, releases]) => {
        return `${size}": ${releases.length}`;
      })
      .join("\n"),
  );

  return organization;
}
