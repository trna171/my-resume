import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import DepthText from "./components/DepthText";
import FloatingEmojis from "./components/FloatingEmojis";
import LightTunnel from "./components/LightTunnel/LightTunnel";
import MouseTrail from "./components/MouseTrail/MouseTrail";
import PhotoAlbum from "./components/PhotoAlbum/PhotoAlbum";
import ImageCropModal from "./components/ImageCrop/ImageCropModal";
import "./personal-space.css";

const navItems = [
  { to: "/", label: "首页", end: true },
  { to: "/about", label: "关于我" },
  { to: "/resume", label: "个人简历" },
  { to: "/projects", label: "项目成果" },
  { to: "/archive", label: "档案馆" },
  { to: "/contact", label: "联系我" }
];

function getActiveNavIndex(pathname) {
  const index = navItems.findIndex(
    (item) =>
      pathname === item.to ||
      (item.to !== "/" && pathname.startsWith(item.to))
  );
  return index === -1 ? 0 : index;
}

// 关于我页翻页相册：照片可替换为真实图片（image 字段），tone 为占位色
const aboutAlbum = [
  {
    title: "小时候的我",
    meta: "2004 · 江西赣州",
    tone: "#e8c9a0",
    image: "",
    story:
      "出生在赣州，在一个普通但温暖的小家庭里长大。记忆里是外婆家的老院子、夏天的蝉鸣，还有一群从小玩到大的邻居伙伴。"
  },
  {
    title: "和爸爸妈妈",
    meta: "家人的日常",
    tone: "#b8cfae",
    image: "",
    story:
      "爸妈不爱说太多，但每次回家总有一桌子我爱吃的菜。长大后慢慢明白，那些不说的关心，其实都在日复一日的细节里。"
  },
  {
    title: "和朋友们",
    meta: "一起长大的伙伴",
    tone: "#a8c4d8",
    image: "",
    story:
      "从小学到现在，身边总有那么几个能一起疯、也能一起安静坐着的朋友。他们是我生活里很重要的一部分。"
  },
  {
    title: "大学时光",
    meta: "2022 · 福建农林大学",
    tone: "#d8c0b8",
    image: "",
    story:
      "进了生物科学专业，开始泡实验室。从第一次握移液枪手抖，到能独立完成一轮完整的实验，成长就藏在这些细碎的日常里。"
  },
  {
    title: "现在 · 未来",
    meta: "2026 · 继续向前",
    tone: "#c9bcd8",
    image: "",
    story:
      "即将进入西北大学攻读硕士。想把喜欢的事一直做下去，也把这个网站当作记录自己成长的一本相册。"
  }
];

// 关于我页「我的偏好」默认数据（图文相册格式：与 aboutAlbum 同构，后端未存自定义数据时展示）
const defaultPreferences = [
  {
    id: "mbti",
    title: "MBTI",
    meta: "INTJ · 建筑师型人格",
    image: "",
    tone: "#e8e0c8",
    story: "理性规划、独立专注，喜欢把复杂的事情拆解成清晰的步骤。"
  },
  {
    id: "books",
    title: "喜欢的书",
    meta: "近期在读",
    image: "",
    tone: "#c8d8c8",
    story: "《活着》《三体》《平凡的世界》，喜欢有厚度的故事和那些能让人安静下来的文字。"
  },
  {
    id: "movies",
    title: "喜欢的电影",
    meta: "值得反复看的",
    image: "",
    tone: "#c8d0e0",
    story: "《星际穿越》《肖申克的救赎》，好的电影像一面镜子，看完总会留下点什么。"
  }
];

const resumeSections = [
  { id: "education", label: "教育背景" },
  { id: "internship", label: "实习经历" },
  { id: "research", label: "项目经历" },
  { id: "campus", label: "校园经历" },
  { id: "skills", label: "专业技能" },
  { id: "awards", label: "荣誉奖项" }
];

const resumeContacts = [
  { label: "政治面貌", value: "中共党员" },
  { label: "邮箱", value: "trna2053@gmail.com" },
  { label: "电话", value: "18120837038" },
  { label: "籍贯", value: "江西 · 赣州" },
  { label: "出生年月", value: "2004.04" }
];

const educations = [
  {
    year: "2026.09 – 2029.06",
    school: "西北大学",
    major: "硕士 · 生物技术与工程",
    extra: "联培 · 空军军医大学",
    note: ""
  },
  {
    year: "2022.09 – 2026.06",
    school: "福建农林大学",
    major: "本科 · 生物科学专业",
    extra: "",
    note: "GPA 3.2/4（专业前 20%）· 无学科挂科重修"
  }
];

const skillGroups = [
  {
    title: "技能证书",
    items: ["普通话二级甲等", "C1D 驾照", "大学生英语四级"]
  },
  {
    title: "生信分析",
    items: ["系统发育进化分析", "启动子顺式作用元件预测", "种间共线性分析", "GWAS"]
  },
  {
    title: "分子实验",
    items: ["DNA 提取", "PCR", "Q-PCR", "电泳", "Western Blot"]
  },
  {
    title: "仪器操作",
    items: ["qPCR 仪", "酸度计", "超微量分光光度计", "电泳仪", "制胶板", "冷冻离心机"]
  },
  {
    title: "其他技能",
    items: [
      "Excel 数据透视",
      "PowerPoint 演示设计",
      "Word 方案撰写",
      "Adobe Illustrator 矢量编辑",
      "Origin / TBtools 数据分析与可视化",
      "Tassel 全基因组关联分析",
      "软著专利申请流程",
      "网页前端搭建"
    ]
  }
];

const internships = [
  {
    year: "2026.03 – 2026.07",
    title: "马上住运营实习生",
    org: "三棵树涂料股份有限公司 · 福建",
    points: [
      "项目推广：协助推进福建省区域「马上住」项目推广及落地；参与内容策划与门店运营，支持区域门店获客及业务推广",
      "引流运营：负责福建区域门店线上引流投放执行，涉及年度投放预算约 360 万元，跟进投放计划、渠道执行及效果反馈；整理分析核心指标数据，优化门店投放运营策略"
    ]
  },
  {
    year: "2025.12 – 2026.03",
    title: "项目推广实习生",
    org: "深圳市康哲药业有限公司 · 福建",
    points: [
      "产品推广：参与福建省区域「美泰彤」产品推广，协助开展相关政策宣导与项目落地，支持区域市场推广工作",
      "公益项目：协助推进基金会赠药项目，通过公益赠药模式开展患者援助及产品推广，配合项目执行与流程跟进"
    ]
  },
  {
    year: "2025.04 – 2025.06",
    title: "分子生物实验助理",
    org: "福建荷瑞生物科技有限公司",
    points: [
      "DNA 提取：独立完成 200+ 份样本 DNA 提取，严格按照实验流程进行样本处理与质量控制，提取成功率达 98%",
      "分子实验：参与蛋白质纯化、PCR 扩增及凝胶电泳等实验操作，协助完成样本检测与实验流程推进"
    ]
  },
  {
    year: "2024.07 – 2024.09",
    title: "夏令营带教老师",
    org: "广州市坤拓企业管理有限公司",
    points: [
      "活动策划：策划并执行 2 期夏令营课程，负责课程设计及现场落地，累计招生 100+ 人，家长满意度达 95%",
      "教学运营：负责日常教学及课堂管理，根据学员情况及时调整教学安排，保障课程及活动有序开展"
    ]
  },
  {
    year: "2024.01 – 2024.03",
    title: "公共服务实习生",
    org: "莆田市涵江区街道办事处",
    points: [
      "社区治理：参与社区建设与公共服务工作，协助推进基层治理、居民服务及社区事务落地",
      "资源协调：推动解决民生服务、安全隐患、活动与文化需求等 3 类问题，跟进问题处理及反馈闭环"
    ]
  }
];

const researchProjects = [
  {
    year: "2025.12 – 2026.04",
    title: "本科毕业论文：玉米 ZmNAC130 基因功能与调控机制研究",
    org: "生信分析 + 遗传分析",
    points: [
      "生信分析：围绕玉米 ZmNAC130 基因筛选 5 个物种 100 个同源基因，完成系统发育、基因结构及共线性分析",
      "遗传分析：使用 GWAS 鉴定 35 个显著相关遗传位点，初步解析其表达调控模式",
      "研究成果：明确 ZmNAC130 的胚乳特异性表达特征，并筛选 IPI、UBC 等潜在调控基因"
    ]
  },
  {
    year: "2024.08 – 2025.08",
    title: "学生助理负责人",
    org: "福建农林大学学生工作部",
    points: [
      "团队管理：培训并管理 30+ 名学生助理，统筹排班与人员调配，实现岗位覆盖率 100%",
      "数据管理：负责月度工资核算，熟练运用 Excel（VLOOKUP、SUMIF），提升数据处理效率 30%+"
    ]
  },
  {
    year: "2023.12 – 2024.05",
    title: "乙酰基转移酶课题组",
    org: "全国大学生生命科学竞赛",
    points: [
      "课题研究：参与「OsHAC703 调控叶片衰老的分子机制研究」，负责实验实施及数据可视化",
      "数据分析：分析 50+ 组实验样本，筛选并总结 3 个显著差异基因，完成研究结果可视化展示",
      "竞赛成果：项目获全国大学生生命科学竞赛创新创业赛道国赛银奖、科研探究赛道国赛铜奖"
    ]
  }
];

const campusExperiences = [
  {
    year: "2024.05 – 2025.05",
    title: "支部副书记",
    org: "生物科学专业党支部",
    points: [
      "组织建设：参与 10 名党员的发展与培养，协助完善党员教育与管理机制",
      "活动组织：组织开展 10+ 次「三会一课」及专题学习，累计覆盖党员 40+ 人",
      "协调管理：协助推进纪律监督与支部文化建设，提升组织凝聚力与工作执行力"
    ]
  },
  {
    year: "2023.11 – 2024.11",
    title: "执行主席",
    org: "生命科学学院学生会",
    points: [
      "统筹管理：负责学生会日常运营与团队管理，统筹各部门工作及任务推进",
      "活动策划：组织策划 20+ 场校园文化活动，累计覆盖师生 2000+ 人",
      "沟通协作：建立部门沟通机制并定期主持工作会议，提升协作效率与执行力，工作响应速度提升 30%"
    ]
  },
  {
    year: "2024.09 – 2025.09",
    title: "班长 · 助理班主任",
    org: "22 生物科学 1 班 · 24 生物信息 1 班",
    points: [
      "班级管理：负责班级日常事务及师生沟通，协调学习与活动安排，营造良好班风学风",
      "新生带班：协助管理 40+ 名新生，完成入学接待、信息登记及班级组织建设",
      "活动组织：组织班会及主题教育活动，强化班级沟通协作与团队凝聚力"
    ]
  }
];

const projects = [
  {
    slug: "personal-site",
    title: "个人网站搭建",
    summary: "独立设计与开发的个人网站：Vite + React 前端、Express 后端，包含简历、项目成果、档案馆等模块。",
    year: "2026",
    role: "独立开发 / 全栈",
    stack: ["Vite", "React", "Express", "Node.js", "UI 设计", "部署运维"],
    overview: "从零搭建个人网站，作为学习经历、作品与奖项证书的统一展示空间，并持续迭代维护。",
    problem: "个人资料与项目分散在各处，需要一个统一、可维护且能承载证书管理等实际需求的线上空间。",
    solution: "采用前后端分离架构：React 单页应用负责界面与交互，Express 提供文件上传、分类管理与数据接口；档案馆支持证书预览、下载与分类维护。",
    result: "网站已上线运行，支持在线内容管理与持续迭代，成为个人成长记录与作品展示的载体。"
  },
  {
    slug: "thesis-zmnac130",
    title: "本科毕业论文：玉米 ZmNAC130 基因功能与调控机制研究",
    summary: "围绕玉米 ZmNAC130 基因开展功能与调控机制研究，结合生信分析与遗传分析完成毕业论文。",
    year: "2026",
    role: "生信分析 + 遗传分析",
    stack: ["系统发育分析", "GWAS", "共线性分析", "基因功能预测"],
    overview: "以玉米 ZmNAC130 基因为研究对象，结合生信分析与遗传分析解析其功能与表达调控机制，作为本科毕业论文课题。",
    problem: "基因功能与调控机制的解析涉及大量序列与遗传数据，需要系统化的分析方法来支撑结论。",
    solution: "筛选 5 个物种 100 个同源基因，完成系统发育、基因结构及共线性分析；使用 GWAS 鉴定 35 个显著相关遗传位点，初步解析其表达调控模式。",
    result: "明确 ZmNAC130 的胚乳特异性表达特征，并筛选 IPI、UBC 等潜在调控基因，为后续功能验证提供方向。"
  },
  {
    slug: "student-assistant-lead",
    title: "学生助理负责人",
    summary: "负责学生工作部 30+ 名学生助理的培训、排班与工资核算，实现岗位全覆盖与数据效率提升。",
    year: "2025",
    role: "团队管理 / 数据管理",
    stack: ["团队管理", "Excel 数据分析", "排班统筹"],
    overview: "在福建农林大学学生工作部负责学生助理团队的日常运营，统筹人员管理与数据核算。",
    problem: "助理人数多、排班分散，月度工资核算依赖手工处理，效率低且易出错。",
    solution: "建立统一排班与调配机制，实现岗位覆盖率 100%；运用 Excel（VLOOKUP、SUMIF）重构工资核算流程。",
    result: "数据处理效率提升 30%+，团队管理流程稳定可复制。"
  },
  {
    slug: "oral-ai",
    title: "智寻伶齿项目",
    summary: "面向临床场景设计数据分析与可视化平台，帮助提升诊断效率与项目展示质量。",
    year: "2025",
    role: "项目参与 / 数据分析",
    stack: ["Excel", "Origin", "数据可视化", "科研汇报"],
    overview: "围绕口腔数据处理与场景化展示展开，帮助团队把实验结果从数据表转成更直观的分析结论。",
    problem: "临床数据复杂且分散，项目成员难以快速把结果整理成清晰可说明的版本。",
    solution: "梳理数据结构、设计可视化表达并与项目成员一起优化呈现逻辑，让项目结果更容易用于说明和展示。",
    result: "项目成果被用于实际场景展示，提升诊断效率并顺利完成软件著作权登记。"
  },
  {
    slug: "senescence",
    title: "叶片衰老机制研究",
    summary: "处理 50+ 组样本并整理显著差异基因结果，用于团队展示与后续研究讨论。",
    year: "2024",
    role: "实验实施 / 数据整理",
    stack: ["实验设计", "图表分析", "结果汇报"],
    overview: "参与实验样本处理与结果整理，聚焦于衰老机制相关研究材料的分析与展示。",
    problem: "样本量大且结果分散，传统汇报方式难以快速形成清晰结论。",
    solution: "将实验结果分类整理，重点提炼显著差异基因并设计清晰的图表表达。",
    result: "帮助团队把复杂结果转成可汇报的结构化材料。"
  },
  {
    slug: "life-science-competition",
    title: "全国大学生生命科学竞赛",
    summary: "参与乙酰基转移酶课题组，完成实验实施、分析与结果总结。",
    year: "2023",
    role: "实验参与 / 结果分析",
    stack: ["实验操作", "结果分析", "竞赛汇报"],
    overview: "围绕课题组的研究方向参与实验执行，并协助把研究结果整理成展示材料。",
    problem: "竞赛项目需要兼顾实验执行与成果表达，节奏和组织能力都很重要。",
    solution: "在实验推进中持续补齐记录与分析，并将关键结论整理成一页式汇报内容。",
    result: "项目获得国赛银奖与铜奖，提升了团队整体展示与表达质量。"
  }
];

function PageShell({ title, children, actions, bare = false }) {
  return (
    <div className="page-shell">
      {/* 背景浮动表情装饰（仅子页面，首页不渲染；bare 页面不渲染） */}
      {bare ? null : <FloatingEmojis count={15} />}
      <main className="page-content">
        <section className={`content-section${bare ? " bare-section" : ""}`}>
          <div className={`section-heading${actions ? " row-between" : ""}`}>
            <h2>{title}</h2>
            {actions ? <div className="page-actions inline">{actions}</div> : null}
          </div>
          <div className={`section-card${bare ? " bare-card" : ""}`}>{children}</div>
        </section>
      </main>
    </div>
  );
}

function HomePage() {
  return (
    <div className="home-page">
      <main className="page-content">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-tunnel" aria-hidden="true">
              <LightTunnel
                cableColor="#a89774"
                pulseColor="#7a5a35"
                tunnelColor="#8a7048"
                tunnelOpacity={0}
                speed={0.1}
                flowDirection="outward"
                pulseSpeed={2}
                pulseLength={0.28}
                pulseBlend={1}
                pulseWidth={1}
                cableCount={20}
                thickness={0.35}
                rimWidth={0}
                waviness={0.3}
                sway={0.5}
                size={1}
                centerX={0}
                centerY={0}
                glow={1}
                fadeNear={0.5}
                fadeFar={2}
                brightness={1}
                colorVariance
                colorful
                grain
                grainIntensity={0.05}
                opacity={1}
                mouseInteraction
                mouseStrength={0.1}
              />
            </div>
            <div className="hero-content">
              <h1 className="sr-only">刘念的个人空间</h1>
              <p className="eyebrow">Hello, welcome to</p>
              <DepthText
                text="刘念的个人空间"
                layers={20}
                depth={3}
                faceColor="#f8fafc"
                depthColor="#7c3aed"
                tilt={10}
                pointerTracking
                smoothing={0.17}
                perspective={1000}
                autoOrbit
                orbitSpeed={0.4}
                fontSize="clamp(2.6rem, 8vw, 5.5rem)"
                fontWeight={900}
                shadow
              />
              <p className="hero-slogan">记录过去，探索现在，思考未来。</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// 关于我页：三个区块 + 页面末尾一个统一管理入口（齿轮 → 密码 → 各区块出现编辑齿轮）
function AboutPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showUnlock, setShowUnlock] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    verifyAdmin().then((ok) => {
      if (!cancelled) {
        setIsAdmin(ok);
        setAuthLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUnlock = async (event) => {
    event.preventDefault();
    if (!password.trim()) return;
    setLoginBusy(true);
    setLoginError("");
    try {
      await loginAdmin(password);
      setIsAdmin(true);
      setPassword("");
      setShowUnlock(false);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAdmin(false);
    setShowUnlock(false);
  };

  // 齿轮点击：有 token 但本地未同步 → 先验证；否则展开 / 收起密码框
  const handleGearClick = () => {
    if (showUnlock) {
      setShowUnlock(false);
      return;
    }
    if (!isAdmin && getAdminToken()) {
      verifyAdmin().then((ok) => {
        if (ok) setIsAdmin(true);
        else setShowUnlock(true);
      });
      return;
    }
    setShowUnlock(true);
  };

  // 密码输入时同步清除登录错误提示
  const handlePasswordChange = (value) => {
    setPassword(value);
    setLoginError("");
  };

  // 任一区块保存成功后退出管理（与原先「保存即退出」行为一致）
  const exitAdmin = () => setIsAdmin(false);

  return (
    <PageShell title="关于我" bare>
      {/* 照片 + 简介（管理员可编辑） */}
      <AboutIntroSection isAdmin={isAdmin} onExitAdmin={exitAdmin} />

      {/* 我的相册：图文翻页相册（管理员可编辑） */}
      <AboutEditableSection
        title="我的相册"
        defaultData={aboutAlbum}
        fetchData={fetchAboutAlbum}
        saveData={saveAboutAlbum}
        isAdmin={isAdmin}
        onExitAdmin={exitAdmin}
        divider
      />

      {/* 我的偏好：MBTI / 喜欢的书 / 喜欢的电影（管理员可编辑） */}
      <AboutEditableSection
        title="我的偏好"
        defaultData={defaultPreferences}
        fetchData={fetchAboutPreferences}
        saveData={saveAboutPreferences}
        isAdmin={isAdmin}
        onExitAdmin={exitAdmin}
      />

      {/* 统一管理入口：页面末尾（齿轮 + 密码解锁 / 退出管理） */}
      <AboutAdminBar
        authLoading={authLoading}
        isAdmin={isAdmin}
        showUnlock={showUnlock}
        password={password}
        onPasswordChange={handlePasswordChange}
        loginError={loginError}
        loginBusy={loginBusy}
        onUnlock={handleUnlock}
        onLogout={handleLogout}
        onGearClick={handleGearClick}
      />
    </PageShell>
  );
}

// 关于我页顶部「照片 + 简介」：管理员可编辑照片与三段文字
// 管理状态由 AboutPage 统一控制：isAdmin 为 true 时右上角出现编辑齿轮
function AboutIntroSection({ isAdmin, onExitAdmin }) {
  const [intro, setIntro] = useState({ photo: "", hello: "", lead: "", body: "" });
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [crop, setCrop] = useState(null);
  const noticeTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchAboutIntro()
      .then((data) => {
        if (!cancelled) setIntro(data);
      })
      .catch(() => {
        /* 保持默认 */
      });
    return () => {
      cancelled = true;
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const showNotice = (text) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice(text);
    noticeTimerRef.current = setTimeout(() => setNotice(""), 5000);
  };

  const startEdit = () => {
    setDraft({ ...intro });
    setEditing(true);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setNotice("");
    const clean = {
      photo: draft.photo.trim(),
      hello: draft.hello.trim(),
      lead: draft.lead.trim(),
      body: draft.body.trim()
    };
    try {
      const saved = await saveAboutIntro(clean);
      setIntro(saved);
      setEditing(false);
      onExitAdmin();
      showNotice("已保存");
    } catch (error) {
      showNotice(`保存失败：${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 选择照片：打开裁剪弹窗
  const handlePhoto = (file) => {
    if (!file) return;
    setNotice("");
    setCrop({ file, src: URL.createObjectURL(file) });
  };

  const confirmCrop = async (blob) => {
    setNotice("");
    try {
      const isJpeg = blob.type === "image/jpeg";
      const file = new File([blob], isJpeg ? "crop.jpg" : "crop.png", { type: blob.type || "image/png" });
      const { url } = await uploadAboutImage(file);
      setDraft((d) => (d ? { ...d, photo: url } : d));
      closeCrop();
    } catch (error) {
      showNotice(`图片上传失败：${error.message}`);
    }
  };

  const closeCrop = () => {
    if (crop?.src) URL.revokeObjectURL(crop.src);
    setCrop(null);
  };

  return (
    <div className="about-hero-wrap">
      {/* 查看模式 */}
      {!editing ? (
        <div className="about-hero">
          <div className="about-photo">
            {intro.photo ? (
              <img className="about-photo__img" src={intro.photo} alt="我的照片" />
            ) : (
              <>
                <span className="about-photo__text">照片位</span>
                <span className="about-photo__hint">这里会放一张我的照片</span>
              </>
            )}
          </div>
          <div className="about-intro">
            <p className="about-intro__hello">{intro.hello}</p>
            <p className="about-intro__lead">{intro.lead}</p>
            <p className="about-intro__body">{intro.body}</p>
          </div>
        </div>
      ) : (
        /* 编辑模式 */
        <div className="about-hero about-hero--edit">
          <div className="about-photo">
            {draft?.photo ? (
              <img className="about-photo__img" src={draft.photo} alt="照片预览" />
            ) : (
              <>
                <span className="about-photo__text">照片位</span>
                <span className="about-photo__hint">这里会放一张我的照片</span>
              </>
            )}
          </div>
          <div className="about-intro">
            <div className="intro-edit__field">
              <label className="intro-edit__label" htmlFor="intro-hello">问候语</label>
              <input
                id="intro-hello"
                className="pref-edit__title"
                value={draft?.hello || ""}
                onChange={(event) => setDraft((d) => (d ? { ...d, hello: event.target.value } : d))}
              />
            </div>
            <div className="intro-edit__field">
              <label className="intro-edit__label" htmlFor="intro-lead">引导语</label>
              <input
                id="intro-lead"
                className="pref-edit__title"
                value={draft?.lead || ""}
                onChange={(event) => setDraft((d) => (d ? { ...d, lead: event.target.value } : d))}
              />
            </div>
            <div className="intro-edit__field">
              <label className="intro-edit__label" htmlFor="intro-body">简介正文</label>
              <textarea
                id="intro-body"
                className="pref-edit__story"
                rows={4}
                value={draft?.body || ""}
                onChange={(event) => setDraft((d) => (d ? { ...d, body: event.target.value } : d))}
              />
            </div>
            <div className="intro-edit__photo-actions">
              <label className="action-btn intro-edit__upload">
                上传照片
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    handlePhoto(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
              {draft?.photo ? (
                <button className="action-btn" type="button" onClick={() => setDraft((d) => (d ? { ...d, photo: "" } : d))}>
                  移除照片
                </button>
              ) : null}
            </div>
            <div className="about-prefs__actions intro-edit__actions">
              <button className="action-btn action-btn--save" type="button" onClick={save} disabled={saving}>
                {saving ? "保存中…" : "保存"}
              </button>
              <button className="action-btn" type="button" onClick={() => setEditing(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 管理齿轮：仅统一登录后显示（编辑 / 完成编辑） */}
      {isAdmin ? (
        <div className="about-hero__gear">
          <button
            className={`gear-btn${editing ? " active" : ""}`}
            type="button"
            onClick={editing ? () => setEditing(false) : startEdit}
            aria-label={editing ? "完成编辑" : "编辑内容"}
            title={editing ? "完成编辑" : "编辑内容"}
          >
            <GearIcon />
          </button>
        </div>
      ) : null}
      {notice ? <div className="archive-notice about-hero__notice">{notice}</div> : null}

      {/* 图片裁剪弹窗 */}
      {crop ? (
        <ImageCropModal
          imageSrc={crop.src}
          onCancel={closeCrop}
          onConfirm={confirmCrop}
        />
      ) : null}
    </div>
  );
}

// 关于我页通用「图文区块」（我的相册 / 我的偏好共用）：
// 查看模式 = 翻页相册；管理入口 = 标题右上角隐藏小齿轮；登录后可编辑内容/图片/顺序
// 管理状态由 AboutPage 统一控制：isAdmin 为 true 时标题右上角出现编辑齿轮
function AboutEditableSection({ title, sub, defaultData, fetchData, saveData, isAdmin, onExitAdmin, divider = false }) {
  const [items, setItems] = useState(defaultData);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);
  const [crop, setCrop] = useState(null); // { itemId, file, src }
  const noticeTimerRef = useRef(null);

  // 显示提示：5 秒后自动消失
  const showNotice = (text) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice(text);
    noticeTimerRef.current = setTimeout(() => setNotice(""), 5000);
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchData()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        /* 保持默认 */
      });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const startEdit = () => {
    setDraft(items.map((p) => ({ ...p })));
    setNotice("");
    setEditing(true);
  };

  const updateDraft = (id, patch) => {
    setDraft((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const moveCard = (index, dir) => {
    setDraft((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addCard = () => {
    setDraft((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, title: "新卡片", meta: "", image: "", tone: "#e8e0c8", story: "" }
    ]);
  };

  const removeCard = (id) => {
    if (draft.length <= 1) {
      showNotice("至少保留一张卡片");
      return;
    }
    setDraft((prev) => prev.filter((p) => p.id !== id));
  };

  // 选择图片：打开裁剪弹窗（不直接上传）
  const handleImage = (itemId, file) => {
    if (!file) return;
    setNotice("");
    setCrop({ itemId, file, src: URL.createObjectURL(file) });
  };

  // 裁剪完成：上传裁剪后的图片并写入草稿
  const confirmCrop = async (blob) => {
    const itemId = crop.itemId;
    setNotice("");
    try {
      const isJpeg = blob.type === "image/jpeg";
      const file = new File([blob], isJpeg ? "crop.jpg" : "crop.png", { type: blob.type || "image/png" });
      const { url } = await uploadAboutImage(file);
      updateDraft(itemId, { image: url });
      closeCrop();
    } catch (error) {
      showNotice(`图片上传失败：${error.message}`);
    }
  };

  const closeCrop = () => {
    if (crop?.src) URL.revokeObjectURL(crop.src);
    setCrop(null);
  };

  const save = async () => {
    setSaving(true);
    setNotice("");
    const clean = draft
      .map((p) => ({
        id: p.id,
        title: p.title.trim(),
        meta: p.meta.trim(),
        image: p.image.trim(),
        tone: p.tone || "#e8e0c8",
        story: p.story.trim()
      }))
      .filter((p) => p.title);
    try {
      const saved = await saveData(clean);
      setItems(saved);
      setEditing(false);
      // 保存后退出管理（保持纯查看状态，已保存的卡片通过 setItems 立即生效不消失）
      onExitAdmin();
      showNotice("已保存");
    } catch (error) {
      showNotice(`保存失败：${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`about-prefs${divider ? " with-divider" : ""}`}>
      <div className="about-prefs__heading">
        <h3 className="about-prefs__title">{title}</h3>
        {sub ? <p className="about-prefs__sub">{sub}</p> : null}
        {isAdmin ? (
          <div className="about-prefs__gear">
            <button
              className={`gear-btn${editing ? " active" : ""}`}
              type="button"
              onClick={editing ? () => setEditing(false) : startEdit}
              aria-label={editing ? "完成编辑" : "编辑内容"}
              title={editing ? "完成编辑" : "编辑内容"}
            >
              <GearIcon />
            </button>
          </div>
        ) : null}
      </div>

      {/* 查看模式：图文翻页相册 */}
      {!editing ? (
        <PhotoAlbum pages={items} />
      ) : (
        <div className="about-prefs__grid">
          {draft.map((item, index) => (
            <div key={item.id} className="pref-card pref-card--edit">
              {/* 图片区：预览 + 上传 / 替换 / 移除 */}
              <div className="pref-edit__photo">
                {item.image ? (
                  <img className="pref-edit__thumb" src={item.image} alt={item.title} />
                ) : (
                  <div className="pref-edit__thumb pref-edit__thumb--empty" style={{ "--tone": item.tone }}>
                    <span>暂无图片</span>
                  </div>
                )}
                <div className="pref-edit__photo-actions">
                  <label className="button button-secondary small pref-edit__upload">
                    上传图片
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        handleImage(item.id, event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {item.image ? (
                    <button
                      type="button"
                      className="button button-secondary small"
                      onClick={() => updateDraft(item.id, { image: "" })}
                    >
                      移除图片
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="pref-card__row">
                <input
                  className="pref-edit__title"
                  value={item.title}
                  onChange={(event) => updateDraft(item.id, { title: event.target.value })}
                  placeholder="卡片标题"
                  aria-label="卡片标题"
                />
                <div className="pref-card__moves">
                  <button
                    type="button"
                    className="pref-card__move"
                    onClick={() => moveCard(index, -1)}
                    disabled={index === 0}
                    aria-label="上移"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="pref-card__move"
                    onClick={() => moveCard(index, 1)}
                    disabled={index === draft.length - 1}
                    aria-label="下移"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="pref-card__remove"
                    onClick={() => removeCard(item.id)}
                    aria-label="删除卡片"
                  >
                    删除
                  </button>
                </div>
              </div>

              <input
                className="pref-edit__meta"
                value={item.meta}
                onChange={(event) => updateDraft(item.id, { meta: event.target.value })}
                placeholder="副标题（时间 / 说明）"
                aria-label="副标题"
              />
              <textarea
                className="pref-edit__story"
                value={item.story}
                onChange={(event) => updateDraft(item.id, { story: event.target.value })}
                placeholder="描述这段内容……"
                aria-label="描述"
                rows={3}
              />
            </div>
          ))}
        </div>
      )}

      {/* 编辑模式下的新增 / 保存操作 */}
      {editing ? (
        <div className="about-prefs__actions">
          <button className="action-btn" type="button" onClick={addCard}>
            ＋ 新增卡片
          </button>
          <button className="action-btn action-btn--save" type="button" onClick={save} disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </button>
          <button className="action-btn" type="button" onClick={() => setEditing(false)}>
            取消
          </button>
        </div>
      ) : null}

      {notice ? <div className={`archive-notice${notice.includes("失败") ? " error" : ""}`}>{notice}</div> : null}

      {/* 图片裁剪弹窗 */}
      {crop ? (
        <ImageCropModal
          imageSrc={crop.src}
          onCancel={closeCrop}
          onConfirm={confirmCrop}
        />
      ) : null}
    </section>
  );
}

// 关于我页统一管理入口（页面末尾）：一个齿轮管理全部区块
// 未登录 → 齿轮；点击 → 密码框；已登录 → 退出管理
function AboutAdminBar({ authLoading, isAdmin, showUnlock, password, onPasswordChange, loginError, loginBusy, onUnlock, onLogout, onGearClick }) {
  if (authLoading) return null;
  return (
    <div className="about-admin-bar">
      {isAdmin ? (
        <button
          className="gear-btn gear-btn--logout"
          type="button"
          onClick={onLogout}
          aria-label="退出管理"
          title="退出管理"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      ) : showUnlock ? (
        <form className="archive-unlock gear-unlock about-admin-bar__unlock" onSubmit={onUnlock}>
          <input
            className="archive-password"
            type="password"
            placeholder="管理密码"
            aria-label="管理密码"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
          <button className="button button-primary" type="submit" disabled={loginBusy || !password.trim()}>
            {loginBusy ? "验证中…" : "确认"}
          </button>
          <button className="gear-btn" type="button" onClick={onGearClick} aria-label="取消">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </form>
      ) : (
        <button className="gear-btn" type="button" onClick={onGearClick} aria-label="管理" title="管理">
          <GearIcon />
        </button>
      )}
      {loginError ? <span className="about-admin-bar__error">{loginError}</span> : null}
    </div>
  );
}

// 隐藏管理入口：小齿轮图标
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// 折叠区块：收起时仅显示主标题 + 副标题，点击后原位展开详情
// 每个条目独立 state，多个区块可同时保持打开
function ResumeCollapseItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`resume-collapse__item${open ? " open" : ""}`}>
      <button
        type="button"
        className="resume-collapse__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="resume-collapse__year">{item.year}</span>
        <span className="resume-collapse__titles">
          <span className="resume-collapse__title">{item.title}</span>
          <span className="resume-collapse__org">{item.org}</span>
        </span>
        <span className="resume-collapse__icon" aria-hidden="true" />
      </button>
      <div className="resume-collapse__body">
        <div className="resume-collapse__inner">
          <ul className="resume-points">
            {item.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function ResumeCollapse({ items }) {
  return (
    <div className="resume-collapse">
      {items.map((item) => (
        <ResumeCollapseItem key={item.title} item={item} />
      ))}
    </div>
  );
}

function ResumeSectionContent({ id }) {
  switch (id) {
    case "education":
      return (
        <div className="resume-edu">
          {educations.map((edu) => (
            <div key={edu.school} className="resume-edu__item">
              <span className="resume-edu__year">{edu.year}</span>
              <div className="resume-edu__body">
                <h4>{edu.school}</h4>
                <div className="resume-edu__meta">
                  <p className="meta">{edu.major}</p>
                  {edu.extra ? <span className="resume-edu__extra">{edu.extra}</span> : null}
                </div>
                {edu.note ? <p className="resume-edu__note">{edu.note}</p> : null}
              </div>
            </div>
          ))}
        </div>
      );
    case "internship":
      return <ResumeCollapse items={internships} />;
    case "research":
      return <ResumeCollapse items={researchProjects} />;
    case "campus":
      return <ResumeCollapse items={campusExperiences} />;
    case "skills":
      return (
        <div className="resume-skills">
          {skillGroups.map((group) => (
            <div key={group.title} className="resume-skill-group">
              <h4>{group.title}</h4>
              <div className="chip-list">
                {group.items.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case "awards":
      return <AwardsPanel />;
    default:
      return null;
  }
}

function ResumePage() {
  const [activeSection, setActiveSection] = useState("education");
  const active = resumeSections.find((s) => s.id === activeSection) || resumeSections[0];

  return (
    <PageShell
      title="个人简历"
      bare
      actions={
        <a className="button button-secondary outline-slim" href="/resume.pdf" target="_blank" rel="noreferrer">
          下载 PDF
        </a>
      }
    >
      {/* 个人信息头部 */}
      <div className="resume-hero">
        <img className="resume-hero__avatar" src="/avatar.png" alt="刘念证件照" />
        <div className="resume-hero__body">
          <h3 className="resume-hero__name">刘念</h3>
          <div className="resume-hero__contacts">
            {resumeContacts.map((item) => (
              <span key={item.label} className="resume-contact">
                <span className="resume-contact__label">{item.label}</span>
                <span className="resume-contact__value">{item.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="resume-layout">
        {/* 左侧章节标签导航 */}
        <aside className="resume-nav">
          {resumeSections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`resume-nav__tab${activeSection === s.id ? " active" : ""}`}
              onClick={() => {
                setActiveSection(s.id);
                if (window.innerWidth <= 900) {
                  document.querySelector(".resume-layout")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            >
              {s.label}
            </button>
          ))}
        </aside>

        <div className="resume-grid">
          <section key={active.id} id={active.id} className="resume-card resume-panel">
            <h3>{active.label}</h3>
            <ResumeSectionContent id={active.id} />
          </section>
        </div>
      </div>
    </PageShell>
  );
}

// 预览弹窗：Portal 渲染到 body（避免祖先 transform 影响 fixed 定位）
// Esc 关闭 / 初始聚焦 / 锁定背景滚动 / aria 语义
function PreviewModal({ item, onClose, children }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="preview-modal" role="dialog" aria-modal="true" aria-label="文件预览" onClick={onClose}>
      <div className="preview-modal__box" onClick={(event) => event.stopPropagation()}>
        <button ref={closeRef} className="preview-modal__close" type="button" onClick={onClose} aria-label="关闭预览">
          ✕
        </button>
        <img src={`/api/files/${item.id}`} alt={item.name} />
        <div className="preview-modal__meta">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function AwardsPanel() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showUnlock, setShowUnlock] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [managing, setManaging] = useState(false);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [dragCategory, setDragCategory] = useState(null);

  // 拖拽排序（分类组内）：拖起抬高、经过让位、松手保存
  const dragSort = useDragSort({
    isAdmin,
    getVisibleIds: () => {
      if (!dragCategory) return [];
      return files.filter((f) => f.category === dragCategory).map((f) => f.id);
    },
    applyOrder: (ids) => {
      setFiles((prev) => {
        const byId = new Map(prev.map((f) => [f.id, f]));
        const reordered = ids.map((id) => byId.get(id)).filter(Boolean);
        const rest = prev.filter((f) => !ids.includes(f.id));
        return [...reordered, ...rest];
      });
    },
    saveOrder: (ids) => {
      if (!ids.length) return;
      reorderFiles(ids).catch((error) => setLoginError(`排序保存失败：${error.message}`));
    }
  });

  const startRename = (item) => {
    setRenameId(item.id);
    setRenameValue(item.name);
  };

  // 保存重命名：乐观更新，失败回滚
  const handleRename = async (id) => {
    const name = renameValue.trim();
    setRenameId(null);
    if (!name || !id) return;
    const prev = files;
    setFiles((prevFiles) => prevFiles.map((f) => (f.id === id ? { ...f, name } : f)));
    try {
      await updateFileName(id, name);
    } catch (error) {
      setLoginError(`重命名失败：${error.message}`);
      setFiles(prev);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await fetchFiles();
        if (!cancelled) setFiles(stored);
      } catch {
        /* 忽略 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    verifyAdmin().then((ok) => {
      if (!cancelled) {
        setIsAdmin(ok);
        setAuthLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUnlock = async (event) => {
    event.preventDefault();
    if (!password.trim()) return;
    setLoginBusy(true);
    setLoginError("");
    try {
      await loginAdmin(password);
      setIsAdmin(true);
      setShowUnlock(false);
      setPassword("");
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogoutAwards = () => {
    logoutAdmin();
    setIsAdmin(false);
    setManaging(false);
    setShowUnlock(false);
  };

  // 齿轮点击：token 感知（与关于我页一致）
  const handleGearClick = async () => {
    if (!isAdmin && getAdminToken()) {
      const ok = await verifyAdmin();
      if (ok) {
        setIsAdmin(true);
        return;
      }
    }
    setShowUnlock(true);
  };

  const handleCategoryChange = async (id, category) => {
    // 乐观更新，立即生效
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, category } : f)));
    try {
      await updateFileCategory(id, category);
    } catch (error) {
      setLoginError(`分类保存失败：${error.message}`);
      try {
        setFiles(await fetchFiles());
      } catch {
        /* 忽略 */
      }
    }
  };

  const grouped = archiveCategories
    .map((cat) => ({ cat, items: files.filter((f) => f.category === cat.key) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {/* 管理员入口（隐藏小齿轮） */}
      <div className="awards-admin">
        {authLoading ? null : isAdmin ? (
          <>
            <button className="action-btn" type="button" onClick={() => setManaging((v) => !v)}>
              {managing ? "完成管理" : "分类管理"}
            </button>
            <button className="gear-btn gear-btn--logout" type="button" onClick={handleLogoutAwards} aria-label="退出管理" title="退出管理">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        ) : showUnlock ? (
          <form className="archive-unlock gear-unlock" onSubmit={handleUnlock}>
            <input
              className="archive-password"
              type="password"
              placeholder="管理密码"
              aria-label="管理密码"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setLoginError("");
              }}
            />
            <button className="button button-primary" type="submit" disabled={loginBusy || !password.trim()}>
              {loginBusy ? "验证中…" : "确认"}
            </button>
            <button className="gear-btn" type="button" onClick={() => setShowUnlock(false)} aria-label="取消">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </form>
        ) : (
          <button className="gear-btn" type="button" onClick={handleGearClick} aria-label="管理" title="管理">
            <GearIcon />
          </button>
        )}
      </div>

      {loginError ? <div className="archive-notice error awards-error">{loginError}</div> : null}

      {/* 管理面板：按分类分组，可重命名/改分类/自定义组内顺序，与档案馆实时同步 */}
      {managing && isAdmin ? (
        <div className="awards-manager">
          <div className="awards-manager__head">
            <h4>奖项分类管理</h4>
            <p className="meta">点击文件名可重命名，下拉调整分类；用 ↑ ↓ 自定义每个分类内的展示顺序，档案馆将同步。</p>
          </div>
          {grouped.map(({ cat, items }) => (
            <div key={cat.key} className="awards-manager__group">
              <h5 className="awards-manager__group-title">
                {cat.label}
                <span className="awards-manager__group-count">{items.length} 项</span>
              </h5>
              <ul className="awards-manager__list">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={dragSort.isDragging(item.id) ? "dragging" : ""}
                    draggable={isAdmin}
                    onDragStart={(event) => {
                      setDragCategory(item.category);
                      dragSort.startDrag(event, item.id);
                    }}
                    onDragOver={(event) => dragSort.dragOver(event, item.id)}
                    onDrop={(event) => event.preventDefault()}
                    onDragEnd={() => dragSort.endDrag()}
                  >
                    {item.type && item.type.startsWith("image/") ? (
                      <img className="awards-manager__thumb" src={`/api/files/${item.id}`} alt="" loading="lazy" />
                    ) : (
                      <span className="awards-manager__thumb awards-manager__thumb--doc">PDF</span>
                    )}
                    {renameId === item.id ? (
                      <input
                        className="archive-rename-input awards-manager__rename"
                        value={renameValue}
                        autoFocus
                        onChange={(event) => setRenameValue(event.target.value)}
                        onBlur={() => handleRename(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleRename(item.id);
                          if (event.key === "Escape") setRenameId(null);
                        }}
                        aria-label="重命名文件"
                      />
                    ) : (
                      <button
                        className="awards-manager__name"
                        type="button"
                        title="点击重命名"
                        onClick={() => startRename(item)}
                      >
                        {displayFileName(item)}
                      </button>
                    )}
                    <select
                      className="archive-category-select awards-manager__select"
                      value={item.category}
                      onChange={(event) => handleCategoryChange(item.id, event.target.value)}
                      aria-label={`${item.name} 分类`}
                    >
                      {archiveCategories.map((cat) => (
                        <option key={cat.key} value={cat.key}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {/* 荣誉奖项分组展示 */}
      {loading ? (
        <p className="meta">加载中…</p>
      ) : grouped.length === 0 ? (
        <p className="meta">暂无奖项数据，点击「管理员」为档案馆文件分类。</p>
      ) : (
        <div className="resume-awards">
          {grouped.map(({ cat, items }) => (
            <div key={cat.key} className="resume-award-group">
              <h4 className="resume-award-group__title">
                {cat.label}
                <span className="resume-award-group__count">{items.length} 项</span>
              </h4>
              <ul className="resume-award__list">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="resume-award__link"
                      title="点击查看"
                      onClick={() => setPreview(item)}
                    >
                      {displayFileName(item)}
                    </button>
                    {item.date ? (
                      <span className="resume-award__date">{item.date.replace(/-/g, ".").slice(0, 7)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 预览弹窗 */}
      {preview ? (
        <PreviewModal item={preview} onClose={() => setPreview(null)}>
          <strong>{displayFileName(preview)}</strong>
          {preview.date ? <span>{preview.date}</span> : null}
          <a className="button button-primary small" href={`/api/files/${preview.id}/download`}>
            下载原图
          </a>
        </PreviewModal>
      ) : null}
    </>
  );
}

function ProjectsPage() {
  return (
    <PageShell
      title="项目成果"
      bare
      actions={
        <Link className="button button-secondary outline-slim" to="/contact">
          联系我
        </Link>
      }
    >
      <div className="project-list">
        {projects.map((project) => (
          <article key={project.slug} className="project-item">
            <span className="project-item__year">{project.year}</span>
            <div className="project-item__body">
              <h3 className="project-item__title">{project.title}</h3>
              <p className="project-item__role">{project.role}</p>
              <p className="project-item__summary">{project.summary}</p>
              <div className="chip-list">
                {project.stack.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
              <Link className="project-link" to={`/projects/${project.slug}`}>
                查看详情
              </Link>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function ProjectDetailPage() {
  const { slug } = useParams();
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return (
      <PageShell
        title="项目不存在"
        bare
        actions={
          <Link className="button button-secondary outline-slim" to="/projects">
            返回项目列表
          </Link>
        }
      >
        <p className="meta">当前项目暂未开放。</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={project.title}
      bare
      actions={
        <Link className="back-link" to="/projects">
          返回项目列表
        </Link>
      }
    >
      <div className="project-detail">
        <aside className="project-meta">
          <div className="project-meta__item">
            <p className="project-meta__label">年份</p>
            <p className="project-meta__value">{project.year}</p>
          </div>
          <div className="project-meta__item">
            <p className="project-meta__label">角色</p>
            <p className="project-meta__value">{project.role}</p>
          </div>
          <div className="project-meta__item">
            <p className="project-meta__label">技术栈</p>
            <div className="chip-list">
              {project.stack.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
        <section className="project-content">
          <div className="project-block">
            <h4>项目概述</h4>
            <p>{project.overview}</p>
          </div>
          <div className="project-block">
            <h4>问题背景</h4>
            <p>{project.problem}</p>
          </div>
          <div className="project-block">
            <h4>解决方案</h4>
            <p>{project.solution}</p>
          </div>
          <div className="project-block">
            <h4>成果与价值</h4>
            <p>{project.result}</p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function ContactPage() {
  return (
    <PageShell title="联系我" bare>
      <div className="contact-list">
        <div className="contact-row">
          <span className="contact-row__label">邮箱</span>
          <span className="contact-row__value">trna2053@gmail.com</span>
        </div>
        <div className="contact-row">
          <span className="contact-row__label">手机</span>
          <a className="contact-row__value" href="tel:18120837038">
            18120837038
          </a>
        </div>
        <div className="contact-row">
          <span className="contact-row__label">QQ</span>
          <span className="contact-row__value">3145827049</span>
        </div>
        <div className="contact-row">
          <span className="contact-row__label">GitHub</span>
          <a
            className="contact-row__value"
            href="https://github.com/trna171"
            target="_blank"
            rel="noreferrer"
          >
            github.com/trna171
          </a>
        </div>
        <div className="contact-row">
          <span className="contact-row__label">微信公众号</span>
          <div className="contact-wechat">
            <img
              className="contact-wechat__qr"
              src="/wechat-qr.jpg"
              alt="微信公众号二维码"
              loading="lazy"
            />
            <a
              className="contact-wechat__link"
              href="http://weixin.qq.com/r/mp/vCCju0DEJR1arQTY93Wu"
              target="_blank"
              rel="noreferrer"
            >
              weixin.qq.com/r/mp/vCCju0DEJR1arQTY93Wu
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// 档案馆使用服务器磁盘存储（Express 后端）
// 开发环境由 Vite 代理转发 /api，生产环境同源（后端同时托管前端）

const ADMIN_TOKEN_KEY = "my-site-admin-token";

function getAdminToken() {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function setAdminToken(token) {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* 忽略 */
  }
}

async function apiFetch(url, options) {
  const headers = { ...(options?.headers || {}) };
  const token = getAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !url.includes("/api/auth/")) {
    setAdminToken("");
  }
  if (!res.ok) {
    let message = `请求失败（${res.status}）`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* 忽略解析错误 */
    }
    throw new Error(message);
  }
  return res.json();
}

async function fetchFiles() {
  return apiFetch("/api/files");
}

// 修改文件分类（管理员），档案馆与荣誉奖项实时同步
async function updateFileCategory(id, category) {
  return apiFetch(`/api/files/${id}/category`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category })
  });
}

// 修改文件名（管理员），档案馆与荣誉奖项实时同步
async function updateFileName(id, name) {
  return apiFetch(`/api/files/${id}/name`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
}

async function loginAdmin(password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  if (!res.ok) {
    let message = "登录失败";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* 忽略 */
    }
    throw new Error(message);
  }
  const data = await res.json();
  setAdminToken(data.token);
  return data.token;
}

async function verifyAdmin() {
  try {
    const data = await apiFetch("/api/auth/verify");
    return !!data.ok;
  } catch {
    return false;
  }
}

function logoutAdmin() {
  setAdminToken("");
}

async function uploadFiles(files, category) {
  // 用 raw 上传：文件名/分类走 URL 编码，文件体走二进制，
  // 规避 multipart 对中文文件名的双重编码问题
  const created = [];
  for (const file of files) {
    const url = `/api/raw-upload?name=${encodeURIComponent(file.name)}&category=${encodeURIComponent(category)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
        "Content-Type": "application/octet-stream"
      },
      body: file
    });
    if (!res.ok) {
      let message = `上传失败（${res.status}）`;
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {
        /* 忽略 */
      }
      throw new Error(`${message}：${file.name}`);
    }
    const data = await res.json();
    created.push(...(data.files || []));
  }
  return { files: created };
}

async function deleteFile(id) {
  return apiFetch(`/api/files/${id}`, { method: "DELETE" });
}

async function reorderFiles(ids) {
  return apiFetch("/api/files/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids })
  });
}

// 关于我页「我的偏好」：读取（公开）与保存（管理员）
async function fetchAboutPreferences() {
  const data = await apiFetch("/api/about-preferences");
  return Array.isArray(data) && data.length ? data : defaultPreferences;
}

async function saveAboutPreferences(items) {
  return apiFetch("/api/about-preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items)
  });
}

// 关于我页「我的相册」：读取（公开）与保存（管理员）
async function fetchAboutAlbum() {
  const data = await apiFetch("/api/about-album");
  return Array.isArray(data) && data.length ? data : aboutAlbum;
}

async function saveAboutAlbum(items) {
  return apiFetch("/api/about-album", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items)
  });
}

// 关于我页「简介」：读取（公开）与保存（管理员）
async function fetchAboutIntro() {
  const data = await apiFetch("/api/about-intro");
  return { photo: "", hello: "", lead: "", body: "", ...data };
}

async function saveAboutIntro(payload) {
  return apiFetch("/api/about-intro", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

// 偏好图片上传（管理员）：FormData 单文件，返回 { url }
async function uploadAboutImage(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/about-preferences/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: form
  });
  if (!res.ok) {
    let message = `上传失败（${res.status}）`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* 忽略 */
    }
    throw new Error(message);
  }
  return res.json();
}

async function clearFiles() {
  return apiFetch("/api/files", { method: "DELETE" });
}

function formatSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// 文件扩展名 → 大写缩写（档案卡片类型标签，最长 4 字符）
function fileExtLabel(name) {
  const ext = (String(name || "").match(/\.([^.]+)$/) || [])[1];
  return ext ? ext.toUpperCase().slice(0, 4) : "FILE";
}

// 展示文件名：仅当名称末尾的扩展名与文件真实类型（MIME → 扩展名）一致时才去掉。
// 避免误删用户输入里的点号（如「校优秀毕业生26.06」→ 不应变成「26」）
const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "video/mp4": "mp4",
  "video/webm": "webm"
};

function displayFileName(item) {
  const name = String(item.name || "");
  const realExt = MIME_TO_EXT[String(item.type || "").toLowerCase()] || "";
  const nameExt = (name.match(/\.([^.]+)$/) || [])[1] || "";
  if (realExt && nameExt && realExt.toLowerCase() === nameExt.toLowerCase()) {
    return name.slice(0, -(nameExt.length + 1));
  }
  return name;
}

// 拖拽排序通用逻辑（HTML5 拖拽）：
// - 拖起：记录 dragId（配合 CSS 轻微抬高）
// - 拖动经过：实时重排列表（经过处留出空位，其他项自动让位）
// - 松手：保留新顺序并保存
// getVisibleIds() 返回当前列表 id 顺序；applyOrder(ids) 应用新顺序到完整数据；saveOrder(ids) 持久化
function useDragSort({ isAdmin, getVisibleIds, applyOrder, saveOrder }) {
  const [dragId, setDragId] = useState(null);

  const startDrag = (event, id) => {
    if (!isAdmin) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
    setDragId(id);
  };

  // 拖动经过某卡片：把被拖项移到该位置，其余项自动让位
  const dragOver = (event, targetId) => {
    if (!isAdmin || !dragId || dragId === targetId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const ids = getVisibleIds();
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1 || from === to) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    applyOrder(next);
  };

  // 松手：保留新顺序并保存
  const endDrag = () => {
    if (!dragId) return;
    const ids = getVisibleIds();
    setDragId(null);
    saveOrder(ids);
  };

  const isDragging = (id) => dragId === id;

  return { startDrag, dragOver, endDrag, isDragging };
}

// 统一分类体系：档案馆与简历页「荣誉奖项」完全同步
const archiveCategories = [
  { key: "honor", label: "荣誉称号", icon: "🏅", color: "#f59e0b" },
  { key: "scholarship", label: "奖学金", icon: "🎖", color: "#10b981" },
  { key: "competition", label: "竞赛奖项", icon: "🏆", color: "#8b5cf6" },
  { key: "degree", label: "学位学历", icon: "🎓", color: "#06b6d4" },
  { key: "appointment", label: "聘书", icon: "📋", color: "#6366f1" },
  { key: "certificate", label: "技能证书", icon: "🪪", color: "#3b82f6" },
  { key: "service", label: "实习", icon: "🧾", color: "#84cc16" },
  { key: "other", label: "其他", icon: "📦", color: "#64748b" }
];

const archiveViewModes = [
  { key: "grid", label: "大图标", icon: "▦" },
  { key: "xlarge", label: "超大图标", icon: "▤" },
  { key: "list", label: "列表", icon: "☰" }
];

function ArchivePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("honor");
  const [search, setSearch] = useState("");
  const [uploadCategory, setUploadCategory] = useState("other");
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showUnlock, setShowUnlock] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef(null);

  // 拖拽排序：拖起抬高、经过让位、松手保存
  const dragSort = useDragSort({
    isAdmin,
    getVisibleIds: () => visibleItems.map((item) => item.id),
    applyOrder: (ids) => {
      setItems((prev) => {
        const byId = new Map(prev.map((item) => [item.id, item]));
        const reordered = ids.map((id) => byId.get(id)).filter(Boolean);
        const rest = prev.filter((item) => !ids.includes(item.id));
        return [...reordered, ...rest];
      });
    },
    saveOrder: (ids) => {
      if (!ids.length) return;
      reorderFiles(ids).catch((error) => setNotice(`⚠️ 排序保存失败：${error.message}`));
    }
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await fetchFiles();
        if (!cancelled) setItems(stored);
      } catch (error) {
        if (!cancelled) setNotice(`⚠️ 档案馆读取失败：${error.message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // 校验已保存的密码状态（sessionStorage 中保存的 token）
    verifyAdmin().then((ok) => {
      if (!cancelled) {
        setIsAdmin(ok);
        setAuthLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // 输入密码进入管理模式
  const handleUnlock = async (event) => {
    event.preventDefault();
    if (!password.trim()) return;
    setLoginBusy(true);
    setLoginError("");
    try {
      await loginAdmin(password);
      setIsAdmin(true);
      setPassword("");
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAdmin(false);
    setShowUnlock(false);
  };

  // 齿轮点击：已登录 → 直接管理；有 token 但本地未同步 → 先验证；否则弹出密码框
  const handleGearClick = async () => {
    if (!isAdmin && getAdminToken()) {
      const ok = await verifyAdmin();
      if (ok) {
        setIsAdmin(true);
        return;
      }
    }
    setShowUnlock(true);
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setNotice("");
    event.target.value = "";

    try {
      const result = await uploadFiles(files, uploadCategory);
      // 刷新列表（服务端返回的上传结果直接合并）
      setItems((prev) => [...result.files, ...prev]);
    } catch (error) {
      setNotice(`⚠️ 上传失败：${error.message}`);
    }
  };

  const removeItem = async (id) => {
    if (!window.confirm("确定删除这个文件吗？")) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteFile(id);
    } catch (error) {
      setNotice(`⚠️ 删除失败：${error.message}`);
      // 回滚
      try {
        setItems(await fetchFiles());
      } catch {
        /* 忽略 */
      }
    }
  };

  const clearAll = async () => {
    if (!window.confirm("确定清空档案馆所有文件吗？此操作不可恢复。")) return;
    setItems([]);
    try {
      await clearFiles();
    } catch (error) {
      setNotice(`⚠️ 清空失败：${error.message}`);
      try {
        setItems(await fetchFiles());
      } catch {
        /* 忽略 */
      }
    }
  };

  const startRename = (item) => {
    setRenameId(item.id);
    setRenameValue(item.name);
  };

  // 保存重命名：乐观更新，失败回滚
  const handleRename = async (id) => {
    const name = renameValue.trim();
    setRenameId(null);
    if (!name || !id) return;
    const prev = items;
    setItems((prevItems) => prevItems.map((f) => (f.id === id ? { ...f, name } : f)));
    try {
      await updateFileName(id, name);
    } catch (error) {
      setNotice(`⚠️ 重命名失败：${error.message}`);
      setItems(prev);
    }
  };

  // 拖拽排序已由 useDragSort 管理（实时让位 + 松手保存）

  const visibleItems = items.filter((item) => {
    const matchFilter = item.category === filter;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // 图片（可预览）与其他文件分开展示
  const photos = visibleItems.filter((item) => item.type && item.type.startsWith("image/"));
  const others = visibleItems.filter((item) => !item.type || !item.type.startsWith("image/"));

  return (
    <PageShell
      title="档案馆"
      actions={
        authLoading ? null : isAdmin ? (
          <>
            <select
              className="archive-category-select"
              value={uploadCategory}
              onChange={(event) => setUploadCategory(event.target.value)}
              aria-label="选择上传分类"
            >
              {archiveCategories
                .map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
            </select>
            <button className="action-btn" type="button" onClick={() => fileInputRef.current?.click()}>
              上传文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFiles}
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,audio/*,video/*"
            />
            <button className="gear-btn gear-btn--logout" type="button" onClick={handleLogout} aria-label="退出管理" title="退出管理">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        ) : showUnlock ? (
          <form className="archive-unlock gear-unlock" onSubmit={handleUnlock}>
            <input
              className="archive-password"
              type="password"
              placeholder="管理密码"
              aria-label="管理密码"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setLoginError("");
              }}
            />
            <button className="button button-primary" type="submit" disabled={loginBusy || !password.trim()}>
              {loginBusy ? "验证中…" : "确认"}
            </button>
            <button className="gear-btn" type="button" onClick={() => setShowUnlock(false)} aria-label="取消">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </form>
        ) : (
          <button className="gear-btn" type="button" onClick={handleGearClick} aria-label="管理" title="管理">
            <GearIcon />
          </button>
        )
      }
    >
      {notice ? <div className="archive-notice">{notice}</div> : null}
      {loginError ? <div className="archive-notice error archive-login-error">{loginError}</div> : null}

      <div className="archive-toolbar">
        <div className="archive-filters">
          {archiveCategories.map((cat) => (
            <button
              key={cat.key}
              className={`filter-chip ${filter === cat.key ? "active" : ""}`}
              type="button"
              onClick={() => setFilter(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="archive-actions">
          <input
            className="archive-search"
            type="text"
            placeholder="搜索文件名..."
            aria-label="搜索文件"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="archive-usage">
            {archiveCategories.find((cat) => cat.key === filter)?.label} · {visibleItems.length} 个文件
          </span>
          <div className="archive-view-switch" role="group" aria-label="切换视图">
            {archiveViewModes.map((mode) => (
              <button
                key={mode.key}
                className={`view-btn ${viewMode === mode.key ? "active" : ""}`}
                type="button"
                onClick={() => setViewMode(mode.key)}
                title={mode.label}
                aria-label={mode.label}
              >
                {mode.icon}
              </button>
            ))}
          </div>
          {isAdmin && items.length > 0 ? (
            <button className="text-link danger" type="button" onClick={clearAll}>
              清空
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="archive-empty">
          <p>正在加载档案馆……</p>
        </div>
      ) : items.length === 0 ? (
        <div className="archive-empty">
          <p>档案馆还是空的，点击上方「上传文件」开始收藏吧。</p>
        </div>
      ) : (
        <>
          {photos.length > 0 ? (
            <div className={`photo-grid view-${viewMode}`}>
              {photos.map((item) => (
                <figure
                  key={item.id}
                  className={`photo-card ${viewMode === "list" ? "list-item" : ""} ${dragSort.isDragging(item.id) ? "dragging" : ""}`}
                  draggable={isAdmin}
                  onDragStart={(event) => dragSort.startDrag(event, item.id)}
                  onDragOver={(event) => dragSort.dragOver(event, item.id)}
                  onDrop={(event) => event.preventDefault()}
                  onDragEnd={() => dragSort.endDrag()}
                >
                  <button className="photo-card__img" type="button" onClick={() => setPreview(item)}>
                    <img src={`/api/files/${item.id}`} alt={item.name} loading="lazy" />
                  </button>
                  <figcaption>
                    {isAdmin && renameId === item.id ? (
                      <input
                        className="archive-rename-input"
                        value={renameValue}
                        autoFocus
                        onChange={(event) => setRenameValue(event.target.value)}
                        onBlur={() => handleRename(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleRename(item.id);
                          if (event.key === "Escape") setRenameId(null);
                        }}
                        aria-label="重命名照片"
                      />
                    ) : (
                      <span
                        title={isAdmin ? "点击重命名" : item.name}
                        onClick={() => (isAdmin ? startRename(item) : null)}
                        style={isAdmin ? { cursor: "pointer" } : undefined}
                      >
                        {displayFileName(item)}
                      </span>
                    )}
                    <time>{item.date}</time>
                  </figcaption>
                  {isAdmin ? (
                    <span className="drag-handle" title="拖拽排序">⠿</span>
                  ) : null}
                  {isAdmin ? (
                    <button className="photo-card__delete" type="button" onClick={() => removeItem(item.id)} aria-label="删除照片">
                      ✕
                    </button>
                  ) : null}
                </figure>
              ))}
            </div>
          ) : null}

          {others.length > 0 ? (
            <div className="file-list">
              {others.map((item) => (
                <article
                  key={item.id}
                  className={`file-card ${dragSort.isDragging(item.id) ? "dragging" : ""}`}
                  draggable={isAdmin}
                  onDragStart={(event) => dragSort.startDrag(event, item.id)}
                  onDragOver={(event) => dragSort.dragOver(event, item.id)}
                  onDrop={(event) => event.preventDefault()}
                  onDragEnd={() => dragSort.endDrag()}
                >
                  <div className="file-card__icon">
                    {fileExtLabel(item.name)}
                  </div>
                  <div className="file-card__info">
                    {isAdmin && renameId === item.id ? (
                      <input
                        className="archive-rename-input"
                        value={renameValue}
                        autoFocus
                        onChange={(event) => setRenameValue(event.target.value)}
                        onBlur={() => handleRename(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleRename(item.id);
                          if (event.key === "Escape") setRenameId(null);
                        }}
                        aria-label="重命名文件"
                      />
                    ) : (
                      <h4
                        title={isAdmin ? "点击重命名" : item.name}
                        onClick={() => (isAdmin ? startRename(item) : null)}
                        style={isAdmin ? { cursor: "pointer" } : undefined}
                      >
                        {displayFileName(item)}
                      </h4>
                    )}
                    <p>{formatSize(item.size)} · {item.date}</p>
                  </div>
                  <a className="button button-secondary small" href={`/api/files/${item.id}/download`}>
                    下载
                  </a>
                  {isAdmin ? (
                    <span className="drag-handle" title="拖拽排序">⠿</span>
                  ) : null}
                  {isAdmin ? (
                    <button className="file-card__delete" type="button" onClick={() => removeItem(item.id)} aria-label="删除文件">
                      ✕
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}

          {visibleItems.length === 0 ? (
            <div className="archive-empty">
              <p>没有匹配的文件，换个关键词或分类试试。</p>
            </div>
          ) : null}
        </>
      )}

      {preview ? (
        <PreviewModal item={preview} onClose={() => setPreview(null)}>
          <strong>{preview.name}</strong>
          <span>{formatSize(preview.size)} · {preview.date}</span>
          <a className="button button-primary small" href={`/api/files/${preview.id}/download`}>
            下载原图
          </a>
        </PreviewModal>
      ) : null}
    </PageShell>
  );
}

function AppLayout() {
  const location = useLocation();
  const activeIndex = getActiveNavIndex(location.pathname);
  const brandText = "Myself.Nian.Rest";
  const [topbarHidden, setTopbarHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  // 移动端滚动隐藏顶栏：下滑隐藏、上滑显示、回到顶部恢复（桌面端保持吸顶常驻）
  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth > 900) return;
      const y = window.scrollY;
      const last = lastScrollYRef.current;
      lastScrollYRef.current = y;
      if (y > 80 && y > last) setTopbarHidden(true);
      else if (y < last || y <= 80) setTopbarHidden(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="app-shell">
      <MouseTrail />
      <header className={`topbar${topbarHidden ? " topbar--hidden" : ""}`}>
        <Link className="brand" to="/" aria-label="Myself.Nian.Rest">
          {brandText.split("").map((ch, i) => (
            <span className="brand-letter" key={i}>
              <span className="brand-letter-face">
                {ch === " " ? "\u00A0" : ch}
              </span>
            </span>
          ))}
        </Link>
        <nav className="nav-links">
          {navItems.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to} className={active ? "active" : ""}>
                <span className="roll-text">
                  <span>{item.label}</span>
                  <span aria-hidden="true">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
    </Routes>
  );
}

export default App;